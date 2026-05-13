using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nirvachak_AI.Domain.Entities;
using Nirvachak_AI.Domain.Enums;
using Nirvachak_AI.Infrastructure.Data;
using Nirvachak_AI.Models.Api;

namespace Nirvachak_AI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class AnnouncementsController : ApiBaseController
{
    private readonly AppDbContext _db;

    public AnnouncementsController(AppDbContext db) => _db = db;

    /// <summary>Get active announcements visible to the current user's role</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<AnnouncementListItem>), 200)]
    public async Task<IActionResult> GetAnnouncements([FromQuery] string? category)
    {
        var userId = GetUserId();
        var cId    = GetConstituencyId();
        var role   = GetUserRole();
        var now    = DateTime.UtcNow;

        var query = _db.Announcements
            .Include(a => a.Acknowledgements)
            .Where(a => a.IsActive && (a.ExpiresAt == null || a.ExpiresAt > now));

        if (cId.HasValue)
            query = query.Where(a => a.ConstituencyId == null || a.ConstituencyId == cId);

        query = query.Where(a =>
            a.TargetRoles == "All" ||
            a.TargetRoles.Contains(role) ||
            a.CreatedByUserId == userId);

        if (!string.IsNullOrEmpty(category) && Enum.TryParse<AnnouncementCategory>(category, out var cat))
            query = query.Where(a => a.Category == cat);

        var list = await query
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();

        var result = list.Select(a => new AnnouncementListItem(
            a.Id, a.Title, a.Body,
            a.Category.ToString(), a.CategoryLabel, a.CategoryColor,
            a.CreatedByName, a.TargetRoles,
            a.IsPinned, a.RequiresAcknowledgement,
            a.Acknowledgements.Any(x => x.UserId == userId),
            a.Acknowledgements.Count,
            a.ExpiresAt, a.CreatedAt
        )).ToList();

        return Ok(result);
    }

    /// <summary>Get unread acknowledgement count for the current user</summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(object), 200)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();
        var cId    = GetConstituencyId();
        var role   = GetUserRole();
        var now    = DateTime.UtcNow;

        var count = await _db.Announcements.CountAsync(a =>
            a.IsActive &&
            a.RequiresAcknowledgement &&
            (a.ExpiresAt == null || a.ExpiresAt > now) &&
            (a.ConstituencyId == null || a.ConstituencyId == cId) &&
            (a.TargetRoles == "All" || a.TargetRoles.Contains(role)) &&
            !_db.AnnouncementAcknowledgements.Any(ack => ack.AnnouncementId == a.Id && ack.UserId == userId));

        return Ok(new { count });
    }

    /// <summary>Acknowledge a specific announcement</summary>
    [HttpPost("{id}/acknowledge")]
    [ProducesResponseType(typeof(ApiResult), 200)]
    public async Task<IActionResult> Acknowledge(int id)
    {
        var userId   = GetUserId();
        var userName = GetUserFullName();

        var exists = await _db.Announcements.AnyAsync(a => a.Id == id);
        if (!exists) return NotFound(new ApiResult(false, "Announcement not found."));

        var already = await _db.AnnouncementAcknowledgements
            .AnyAsync(x => x.AnnouncementId == id && x.UserId == userId);

        if (!already)
        {
            _db.AnnouncementAcknowledgements.Add(new AnnouncementAcknowledgement
            {
                AnnouncementId = id,
                UserId   = userId,
                UserName = userName
            });
            await _db.SaveChangesAsync();
        }

        return Ok(new ApiResult(true, "Acknowledged successfully."));
    }

    /// <summary>Post a new announcement</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResult), 200)]
    public async Task<IActionResult> Create([FromBody] CreateAnnouncementRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.Body))
            return BadRequest(new ApiResult(false, "Title and body are required."));

        if (!Enum.TryParse<AnnouncementCategory>(req.Category, out var category))
            return BadRequest(new ApiResult(false, "Invalid category."));

        var userId   = GetUserId();
        var userName = GetUserFullName();
        var cId      = GetConstituencyId();

        var isPinned    = category == AnnouncementCategory.CriticalAlert;
        var requiresAck = category == AnnouncementCategory.ECComplianceNotice || req.RequiresAcknowledgement;

        _db.Announcements.Add(new Announcement
        {
            Title                   = req.Title.Trim(),
            Body                    = req.Body.Trim(),
            Category                = category,
            CreatedByUserId         = userId,
            CreatedByName           = userName,
            ConstituencyId          = cId,
            TargetRoles             = string.IsNullOrWhiteSpace(req.TargetRoles) ? "All" : req.TargetRoles,
            RequiresAcknowledgement = requiresAck,
            IsPinned                = isPinned,
            ExpiresAt               = req.ExpiresAt
        });

        await _db.SaveChangesAsync();
        return Ok(new ApiResult(true, "Announcement posted successfully."));
    }

    /// <summary>Deactivate (soft-delete) an announcement</summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResult), 200)]
    public async Task<IActionResult> Deactivate(int id)
    {
        var userId = GetUserId();
        var role   = GetUserRole();

        var announcement = await _db.Announcements.FindAsync(id);
        if (announcement == null) return NotFound(new ApiResult(false, "Not found."));

        if (role != "Admin" && announcement.CreatedByUserId != userId)
            return Forbid();

        announcement.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(new ApiResult(true, "Announcement removed."));
    }
}
