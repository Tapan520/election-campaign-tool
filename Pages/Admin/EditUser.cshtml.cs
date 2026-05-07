using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Domain.Entities;
using ElectionCampaignTool.Domain.Enums;
using ElectionCampaignTool.Infrastructure.Data;

namespace ElectionCampaignTool.Pages.Admin;

[Authorize(Roles = "Admin,CampaignManager")]
public class EditUserModel : PageModel
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _db;

    public EditUserModel(UserManager<AppUser> userManager, AppDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    [BindProperty]
    public InputModel Input { get; set; } = new();

    [BindProperty]
    public string UserId { get; set; } = string.Empty;

    public List<SelectListItem> ConstituencyItems { get; set; } = new();
    public List<SelectListItem> RoleItems { get; set; } = new();

    public class InputModel
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        [Required]
        public UserRole Role { get; set; }

        public int? ConstituencyId { get; set; }
        public string? AssignedBoothNumbers { get; set; }
        public string? AssignedWard { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public async Task<IActionResult> OnGetAsync(string id)
    {
        var targetUser = await _userManager.FindByIdAsync(id);
        if (targetUser == null) return NotFound();

        var currentUser = await _userManager.GetUserAsync(User);
        bool isAdmin = User.IsInRole(nameof(UserRole.Admin));

        // Manager can only edit FieldWorker or BoothAgent in their constituency
        if (!isAdmin)
        {
            if (targetUser.Role != UserRole.FieldWorker && targetUser.Role != UserRole.BoothAgent)
                return Forbid();
            if (targetUser.ConstituencyId != currentUser?.ConstituencyId)
                return Forbid();
        }

        UserId = id;
        Input = new InputModel
        {
            FullName = targetUser.FullName,
            PhoneNumber = targetUser.PhoneNumber,
            Role = targetUser.Role,
            ConstituencyId = targetUser.ConstituencyId,
            AssignedBoothNumbers = targetUser.AssignedBoothNumbers,
            AssignedWard = targetUser.AssignedWard,
            IsActive = targetUser.IsActive
        };

        await LoadFormDataAsync(isAdmin, currentUser);
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        var targetUser = await _userManager.FindByIdAsync(UserId);
        if (targetUser == null) return NotFound();

        var currentUser = await _userManager.GetUserAsync(User);
        bool isAdmin = User.IsInRole(nameof(UserRole.Admin));

        if (!isAdmin)
        {
            if (targetUser.Role != UserRole.FieldWorker && targetUser.Role != UserRole.BoothAgent)
                return Forbid();
            if (targetUser.ConstituencyId != currentUser?.ConstituencyId)
                return Forbid();
        }

        await LoadFormDataAsync(isAdmin, currentUser);
        if (!ModelState.IsValid) return Page();

        targetUser.FullName = Input.FullName.Trim();
        targetUser.PhoneNumber = Input.PhoneNumber;
        targetUser.AssignedBoothNumbers = Input.AssignedBoothNumbers;
        targetUser.AssignedWard = Input.AssignedWard;
        targetUser.IsActive = Input.IsActive;

        if (isAdmin)
        {
            targetUser.Role = Input.Role;
            targetUser.ConstituencyId = Input.ConstituencyId;
            var existingRoles = await _userManager.GetRolesAsync(targetUser);
            await _userManager.RemoveFromRolesAsync(targetUser, existingRoles);
            await _userManager.AddToRoleAsync(targetUser, Input.Role.ToString());
        }

        await _userManager.UpdateAsync(targetUser);
        TempData["Message"] = $"User '{targetUser.FullName}' updated successfully.";
        return RedirectToPage("/Admin/Index");
    }

    private async Task LoadFormDataAsync(bool isAdmin, AppUser? currentUser)
    {
        IQueryable<Constituency> constQuery = _db.Constituencies.OrderBy(c => c.Name);
        if (!isAdmin && currentUser?.ConstituencyId != null)
            constQuery = constQuery.Where(c => c.Id == currentUser.ConstituencyId);

        ConstituencyItems = await constQuery
            .Select(c => new SelectListItem { Value = c.Id.ToString(), Text = $"{c.Name} ({c.Code})" })
            .ToListAsync();

        var allowedRoles = isAdmin
            ? Enum.GetValues<UserRole>()
            : new[] { UserRole.FieldWorker, UserRole.BoothAgent };

        RoleItems = allowedRoles.Select(r => new SelectListItem { Value = r.ToString(), Text = r.ToString() }).ToList();
    }
}
