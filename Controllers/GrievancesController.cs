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
public class GrievancesController : ApiBaseController
{
    private readonly AppDbContext _db;

    public GrievancesController(AppDbContext db) => _db = db;

    /// <summary>Get grievances (optionally filtered by status)</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<GrievanceListItem>), 200)]
    public async Task<IActionResult> GetGrievances([FromQuery] string? status)
    {
        var cId = GetConstituencyId();
        IQueryable<Grievance> query = _db.Grievances.OrderByDescending(g => g.ReportedAt);
        if (cId.HasValue) query = query.Where(g => g.ConstituencyId == cId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<GrievanceStatus>(status, out var s))
            query = query.Where(g => g.Status == s);

        var items = await query
            .Select(g => new GrievanceListItem(
                g.Id, g.Title, g.Status.ToString(), g.Priority.ToString(),
                g.ReportedBy, g.ReporterPhone, g.Ward, g.Location, g.ReportedAt))
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>Submit a new grievance</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResult), 200)]
    public async Task<IActionResult> Create([FromBody] CreateGrievanceRequest req)
    {
        var cId = GetConstituencyId() ?? 1;
        var priority = Enum.TryParse<GrievancePriority>(req.Priority, out var p)
            ? p : GrievancePriority.Medium;

        _db.Grievances.Add(new Grievance
        {
            Title = req.Title,
            Description = req.Description,
            ReportedBy = req.ReportedBy,
            ReporterPhone = req.ReporterPhone,
            Priority = priority,
            Ward = req.Ward,
            Location = req.Location,
            ConstituencyId = cId,
            Status = GrievanceStatus.Open,
            ReportedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok(new ApiResult(true, "Grievance submitted successfully."));
    }
}
