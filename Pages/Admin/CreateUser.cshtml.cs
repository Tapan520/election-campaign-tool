using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using ElectionCampaignTool.Domain.Entities;
using ElectionCampaignTool.Domain.Enums;
using ElectionCampaignTool.Infrastructure.Data;

namespace ElectionCampaignTool.Pages.Admin;

[Authorize(Roles = "Admin,CampaignManager")]
public class CreateUserModel : PageModel
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _db;

    public CreateUserModel(UserManager<AppUser> userManager, AppDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    [BindProperty]
    public InputModel Input { get; set; } = new();
    public List<SelectListItem> ConstituencyItems { get; set; } = new();
    public List<SelectListItem> RoleItems { get; set; } = new();

    public class InputModel
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        [Required]
        public UserRole Role { get; set; }

        public int? ConstituencyId { get; set; }
        public string? AssignedBoothNumbers { get; set; }
        public string? AssignedWard { get; set; }

        [Required, MinLength(6)]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
    }

    public async Task OnGetAsync()
    {
        await LoadFormDataAsync();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        await LoadFormDataAsync();
        if (!ModelState.IsValid) return Page();

        bool isAdmin = User.IsInRole(nameof(UserRole.Admin));
        var currentUser = await _userManager.GetUserAsync(User);

        // Manager can only create FieldWorker or BoothAgent in their constituency
        if (!isAdmin)
        {
            if (Input.Role != UserRole.FieldWorker && Input.Role != UserRole.BoothAgent)
            {
                ModelState.AddModelError("", "You can only create Worker or BoothAgent users.");
                return Page();
            }
            Input.ConstituencyId = currentUser?.ConstituencyId;
        }

        var user = new AppUser
        {
            UserName = Input.Email,
            Email = Input.Email,
            FullName = Input.FullName,
            PhoneNumber = Input.PhoneNumber,
            Role = Input.Role,
            ConstituencyId = Input.ConstituencyId,
            AssignedBoothNumbers = Input.AssignedBoothNumbers,
            AssignedWard = Input.AssignedWard,
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, Input.Password);
        if (!result.Succeeded)
        {
            foreach (var e in result.Errors)
                ModelState.AddModelError("", e.Description);
            return Page();
        }
        await _userManager.AddToRoleAsync(user, Input.Role.ToString());
        TempData["Message"] = $"User '{Input.FullName}' created successfully.";
        return RedirectToPage("/Admin/Index");
    }

    private async Task LoadFormDataAsync()
    {
        bool isAdmin = User.IsInRole(nameof(UserRole.Admin));
        var currentUser = await _userManager.GetUserAsync(User);

        IQueryable<Constituency> constQuery = _db.Constituencies.OrderBy(c => c.Name);
        if (!isAdmin && currentUser?.ConstituencyId != null)
            constQuery = constQuery.Where(c => c.Id == currentUser.ConstituencyId);

        ConstituencyItems = constQuery
            .Select(c => new SelectListItem { Value = c.Id.ToString(), Text = $"{c.Name} ({c.Code})" })
            .ToList();

        var allowedRoles = isAdmin
            ? Enum.GetValues<UserRole>()
            : new[] { UserRole.FieldWorker, UserRole.BoothAgent };

        RoleItems = allowedRoles.Select(r => new SelectListItem { Value = r.ToString(), Text = r.ToString() }).ToList();
    }
}

