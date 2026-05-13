using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nirvachak_AI.Infrastructure.Data;
using Nirvachak_AI.Models.Api;

namespace Nirvachak_AI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class BoothsController : ApiBaseController
{
    private readonly AppDbContext _db;

    public BoothsController(AppDbContext db) => _db = db;

    /// <summary>Get all booths for the current constituency</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<BoothResponse>), 200)]
    public async Task<IActionResult> GetBooths()
    {
        var cId = GetConstituencyId();
        IQueryable<Domain.Entities.Booth> query = _db.Booths.OrderBy(b => b.BoothNumber);
        if (cId.HasValue) query = query.Where(b => b.ConstituencyId == cId);

        var booths = await query
            .Select(b => new BoothResponse(
                b.Id, b.BoothNumber, b.BoothName, b.Address, b.WardNumber,
                b.TotalVoters, b.MaleVoters, b.FemaleVoters, b.VotedCount,
                b.TotalVoters > 0
                    ? Math.Round((double)b.VotedCount / b.TotalVoters * 100, 1)
                    : 0,
                b.AssignedAgentName, b.AssignedAgentPhone))
            .ToListAsync();

        return Ok(booths);
    }
}
