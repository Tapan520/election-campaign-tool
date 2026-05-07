using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Domain.Entities;
using ElectionCampaignTool.Domain.Enums;
using ElectionCampaignTool.Infrastructure.Data;

namespace ElectionCampaignTool.Pages.Admin;

[Authorize(Roles = "Admin,CampaignManager")]
public class IndexModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public IndexModel(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public List<AppUser> Users { get; set; } = new();
    public List<AuditLog> AuditLogs { get; set; } = new();

    public async Task OnGetAsync()
    {
        var currentUser = await _userManager.GetUserAsync(User);
        bool isAdmin = User.IsInRole(nameof(UserRole.Admin));

        IQueryable<AppUser> query = _db.Users.Include(u => u.Constituency).OrderBy(u => u.FullName);

        if (!isAdmin)
        {
            // Manager sees only FieldWorker and BoothAgent in their constituency
            query = query.Where(u =>
                u.ConstituencyId == currentUser!.ConstituencyId &&
                (u.Role == UserRole.FieldWorker || u.Role == UserRole.BoothAgent));
        }

        Users = await query.ToListAsync();
        AuditLogs = await _db.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(20)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostToggleAsync(string userId)
    {
        var currentUser = await _userManager.GetUserAsync(User);
        bool isAdmin = User.IsInRole(nameof(UserRole.Admin));

        var user = await _userManager.FindByIdAsync(userId);
        if (user != null)
        {
            if (!isAdmin && (user.Role != UserRole.FieldWorker && user.Role != UserRole.BoothAgent))
                return Forbid();
            if (!isAdmin && user.ConstituencyId != currentUser?.ConstituencyId)
                return Forbid();

            user.IsActive = !user.IsActive;
            await _userManager.UpdateAsync(user);
            TempData["Message"] = $"User {user.FullName} has been {(user.IsActive ? "enabled" : "disabled")}.";
        }
        return RedirectToPage();
    }
}
