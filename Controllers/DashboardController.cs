using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nirvachak_AI.Domain.Enums;
using Nirvachak_AI.Infrastructure.Data;
using Nirvachak_AI.Models.Api;

namespace Nirvachak_AI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class DashboardController : ApiBaseController
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db) => _db = db;

    /// <summary>Get dashboard statistics for mobile app</summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(DashboardStatsResponse), 200)]
    public async Task<IActionResult> GetStats()
    {
        var cId = GetConstituencyId();
        var voters = _db.Voters.Where(v => !v.IsDeleted);
        if (cId.HasValue) voters = voters.Where(v => v.ConstituencyId == cId);

        var total      = await voters.CountAsync();
        var favour     = await voters.CountAsync(v => v.Sentiment == VoterSentiment.Favour);
        var against    = await voters.CountAsync(v => v.Sentiment == VoterSentiment.Against);
        var neutral    = await voters.CountAsync(v => v.Sentiment == VoterSentiment.Neutral);
        var unknown    = await voters.CountAsync(v => v.Sentiment == VoterSentiment.Unknown);
        var voted      = await voters.CountAsync(v => v.ElectionDayStatus == ElectionDayStatus.Voted);
        var booths     = cId.HasValue
            ? await _db.Booths.CountAsync(b => b.ConstituencyId == cId)
            : await _db.Booths.CountAsync();
        var grievances = cId.HasValue
            ? await _db.Grievances.CountAsync(g => g.ConstituencyId == cId && g.Status == GrievanceStatus.Open)
            : await _db.Grievances.CountAsync(g => g.Status == GrievanceStatus.Open);
        var volunteers = cId.HasValue
            ? await _db.Volunteers.CountAsync(v => v.ConstituencyId == cId && v.IsActive)
            : await _db.Volunteers.CountAsync(v => v.IsActive);
        var pct = total > 0 ? Math.Round((double)voted / total * 100, 1) : 0;

        return Ok(new DashboardStatsResponse(
            total, favour, against, neutral, unknown,
            booths, grievances, volunteers, voted, pct));
    }
}
