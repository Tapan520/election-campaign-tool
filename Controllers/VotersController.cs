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
public class VotersController : ApiBaseController
{
    private readonly AppDbContext _db;

    public VotersController(AppDbContext db) => _db = db;

    /// <summary>Get paginated voter list with search and filter</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<VoterListItem>), 200)]
    public async Task<IActionResult> GetVoters(
        [FromQuery] string? search,
        [FromQuery] int? booth,
        [FromQuery] string? sentiment,
        [FromQuery] string? gender,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        var cId = GetConstituencyId();
        IQueryable<Voter> query = _db.Voters.Where(v => !v.IsDeleted);
        if (cId.HasValue) query = query.Where(v => v.ConstituencyId == cId);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(v =>
                v.Name.Contains(search) ||
                v.VoterId.Contains(search) ||
                (v.MobileNumber != null && v.MobileNumber.Contains(search)));

        if (booth.HasValue) query = query.Where(v => v.BoothNumber == booth);

        if (!string.IsNullOrEmpty(sentiment) && Enum.TryParse<VoterSentiment>(sentiment, out var sv))
            query = query.Where(v => v.Sentiment == sv);

        if (!string.IsNullOrEmpty(gender)) query = query.Where(v => v.Gender == gender);

        var total = await query.CountAsync();
        pageSize = Math.Clamp(pageSize, 1, 100);

        var items = await query
            .OrderBy(v => v.BoothNumber).ThenBy(v => v.SerialNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VoterListItem(
                v.Id, v.VoterId, v.Name, v.NameLocal,
                v.Age, v.Gender, v.MobileNumber, v.BoothNumber,
                v.WardNumber, v.PannaNumber, v.SerialNumber,
                v.Sentiment.ToString(), v.ElectionDayStatus.ToString(), v.Address))
            .ToListAsync();

        return Ok(new PagedResult<VoterListItem>(
            items, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize)));
    }

    /// <summary>Get voter detail including visit history</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(VoterDetailResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetVoter(int id)
    {
        var v = await _db.Voters
            .Include(x => x.Visits)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

        if (v is null) return NotFound(new ApiResult(false, "Voter not found."));

        var visits = v.Visits
            .OrderByDescending(x => x.VisitedAt)
            .Select(x => new VisitHistoryItem(
                x.Id, x.WorkerName, x.VisitedAt,
                x.Status.ToString(), x.SentimentAfterVisit.ToString(), x.Notes))
            .ToList();

        return Ok(new VoterDetailResponse(
            v.Id, v.VoterId, v.Name, v.NameLocal, v.FatherHusbandName,
            v.Age, v.Gender, v.MobileNumber, v.Address,
            v.BoothNumber, v.WardNumber, v.PannaNumber, v.SerialNumber,
            v.Sentiment.ToString(), v.ElectionDayStatus.ToString(),
            v.Notes, v.ImportedAt, v.LastContactedAt, visits));
    }

    /// <summary>Update voter sentiment</summary>
    [HttpPatch("{id:int}/sentiment")]
    [ProducesResponseType(typeof(ApiResult), 200)]
    public async Task<IActionResult> UpdateSentiment(int id, [FromBody] UpdateSentimentRequest req)
    {
        var voter = await _db.Voters.FindAsync(id);
        if (voter is null) return NotFound(new ApiResult(false, "Voter not found."));

        if (Enum.TryParse<VoterSentiment>(req.Sentiment, out var s))
            voter.Sentiment = s;
        else
            return BadRequest(new ApiResult(false, $"Invalid sentiment value: {req.Sentiment}"));

        await _db.SaveChangesAsync();
        return Ok(new ApiResult(true, "Sentiment updated."));
    }

    /// <summary>Log a door-to-door visit for a voter</summary>
    [HttpPost("{id:int}/visit")]
    [ProducesResponseType(typeof(ApiResult), 200)]
    public async Task<IActionResult> LogVisit(int id, [FromBody] LogVisitRequest req)
    {
        var voter = await _db.Voters.FindAsync(id);
        if (voter is null) return NotFound(new ApiResult(false, "Voter not found."));

        var sentiment = Enum.TryParse<VoterSentiment>(req.Sentiment, out var sv)
            ? sv : VoterSentiment.Unknown;
        var status = Enum.TryParse<VisitStatus>(req.VisitStatus, out var vs)
            ? vs : VisitStatus.Visited;

        _db.DoorToDoorVisits.Add(new DoorToDoorVisit
        {
            VoterId = id,
            WorkerUserId = GetUserId(),
            WorkerName = GetUserFullName(),
            VisitedAt = DateTime.UtcNow,
            Status = status,
            SentimentAfterVisit = sentiment,
            Notes = req.Notes
        });

        voter.Sentiment = sentiment;
        voter.LastContactedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new ApiResult(true, "Visit logged successfully."));
    }
}
