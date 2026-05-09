using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Domain.Enums;
using ElectionCampaignTool.Infrastructure.Data;
using ElectionCampaignTool.Models.Api;

namespace ElectionCampaignTool.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class AnalyticsController : ApiBaseController
{
    private readonly AppDbContext _db;

    public AnalyticsController(AppDbContext db) => _db = db;

    [HttpGet]
    [ProducesResponseType(typeof(AnalyticsResponse), 200)]
    public async Task<IActionResult> GetAnalytics()
    {
        var cId = GetConstituencyId();
        var query = _db.Voters.Where(v => !v.IsDeleted);
        if (cId.HasValue) query = query.Where(v => v.ConstituencyId == cId.Value);

        // Sentiment breakdown
        var sentiment = new SentimentBreakdown(
            await query.CountAsync(v => v.Sentiment == VoterSentiment.Favour),
            await query.CountAsync(v => v.Sentiment == VoterSentiment.Against),
            await query.CountAsync(v => v.Sentiment == VoterSentiment.Neutral),
            await query.CountAsync(v => v.Sentiment == VoterSentiment.Floating),
            await query.CountAsync(v => v.Sentiment == VoterSentiment.Unknown));

        // Gender
        var gender = new GenderBreakdown(
            await query.CountAsync(v => v.Gender == "M"),
            await query.CountAsync(v => v.Gender == "F"),
            await query.CountAsync(v => v.Gender != "M" && v.Gender != "F"));

        // Age groups
        var ageGroups = new List<AgeGroupItem>
        {
            new("18-25", await query.CountAsync(v => v.Age >= 18 && v.Age <= 25)),
            new("26-35", await query.CountAsync(v => v.Age >= 26 && v.Age <= 35)),
            new("36-45", await query.CountAsync(v => v.Age >= 36 && v.Age <= 45)),
            new("46-55", await query.CountAsync(v => v.Age >= 46 && v.Age <= 55)),
            new("56-65", await query.CountAsync(v => v.Age >= 56 && v.Age <= 65)),
            new("66+",   await query.CountAsync(v => v.Age >= 66)),
        };

        // Booth breakdown
        var boothNums = await query
            .Select(v => v.BoothNumber).Distinct().OrderBy(n => n).ToListAsync();

        var boothBreakdown = new List<BoothAnalyticsItem>();
        foreach (var bn in boothNums)
        {
            var bq = query.Where(v => v.BoothNumber == bn);
            boothBreakdown.Add(new BoothAnalyticsItem(
                bn,
                await bq.CountAsync(),
                await bq.CountAsync(v => v.Sentiment == VoterSentiment.Favour),
                await bq.CountAsync(v => v.Sentiment == VoterSentiment.Against),
                await bq.CountAsync(v => v.Sentiment == VoterSentiment.Neutral),
                await bq.CountAsync(v => v.Sentiment == VoterSentiment.Unknown),
                await bq.CountAsync(v => v.Sentiment == VoterSentiment.Floating)));
        }

        return Ok(new AnalyticsResponse(sentiment, gender, ageGroups, boothBreakdown));
    }
}
