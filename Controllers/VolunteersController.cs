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
public class VolunteersController : ApiBaseController
{
    private readonly AppDbContext _db;

    public VolunteersController(AppDbContext db) => _db = db;

    /// <summary>Get all active volunteers</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<VolunteerListItem>), 200)]
    public async Task<IActionResult> GetVolunteers()
    {
        var cId = GetConstituencyId();
        IQueryable<Domain.Entities.Volunteer> query = _db.Volunteers.OrderBy(v => v.Name);
        if (cId.HasValue) query = query.Where(v => v.ConstituencyId == cId);

        var items = await query
            .Select(v => new VolunteerListItem(
                v.Id, v.Name, v.Phone, v.Task.ToString(),
                v.AssignedArea, v.AssignedBoothNumbers, v.IsActive))
            .ToListAsync();

        return Ok(items);
    }
}
