using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ElectionCampaignTool.Domain.Entities;
using ElectionCampaignTool.Domain.Enums;

namespace ElectionCampaignTool.Pages.Admin;

[Authorize(Roles = "Admin")]
public class DeleteUserModel : PageModel
{
    private readonly UserManager<AppUser> _userManager;
    public DeleteUserModel(UserManager<AppUser> userManager) => _userManager = userManager;

    public AppUser? TargetUser { get; set; }

    public async Task<IActionResult> OnGetAsync(string id)
    {
        TargetUser = await _userManager.FindByIdAsync(id);
        if (TargetUser == null) return NotFound();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var currentUser = await _userManager.GetUserAsync(User);
        if (user.Id == currentUser?.Id)
        {
            TempData["Error"] = "You cannot delete your own account.";
            return RedirectToPage("/Admin/Index");
        }

        var result = await _userManager.DeleteAsync(user);
        if (result.Succeeded)
            TempData["Message"] = $"User '{user.FullName}' deleted.";
        else
            TempData["Error"] = "Error deleting user: " + string.Join(", ", result.Errors.Select(e => e.Description));

        return RedirectToPage("/Admin/Index");
    }
}
