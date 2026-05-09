using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Infrastructure.Data;
using ElectionCampaignTool.Models.Api;

namespace ElectionCampaignTool.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class SurveysController : ApiBaseController
{
    private readonly AppDbContext _db;

    public SurveysController(AppDbContext db) => _db = db;

    [HttpGet]
    [ProducesResponseType(typeof(List<SurveyListItem>), 200)]
    public async Task<IActionResult> GetSurveys()
    {
        var cId = GetConstituencyId();
        var query = _db.Surveys.Include(s => s.Responses).AsQueryable();
        if (cId.HasValue) query = query.Where(s => s.ConstituencyId == cId.Value);

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SurveyListItem(
                s.Id, s.Title, s.Description, s.Category.ToString(),
                s.IsActive, s.Responses.Count, s.CreatedAt))
            .ToListAsync();

        return Ok(items);
    }
}
