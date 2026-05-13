using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Nirvachak_AI.Domain.Entities;
using Nirvachak_AI.Domain.Enums;
using Nirvachak_AI.Infrastructure.Data;

namespace Nirvachak_AI.Pages.Voters;

public class EditModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public EditModel(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [BindProperty]
    public Voter? Voter { get; set; }

    private async Task<bool> IsRestrictedRoleAsync()
    {
        var user = await _userManager.GetUserAsync(User);
        return user?.Role == UserRole.FieldWorker || user?.Role == UserRole.BoothAgent;
    }

    public async Task<IActionResult> OnGetAsync(int id)
    {
        if (await IsRestrictedRoleAsync()) return Forbid();
        Voter = await _db.Voters.FindAsync(id);
        if (Voter == null) return NotFound();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (await IsRestrictedRoleAsync()) return Forbid();
        if (!ModelState.IsValid) return Page();
        var existing = await _db.Voters.FindAsync(Voter!.Id);
        if (existing == null) return NotFound();

        existing.Name = Voter.Name;
        existing.NameLocal = Voter.NameLocal;
        existing.FatherHusbandName = Voter.FatherHusbandName;
        existing.Age = Voter.Age;
        existing.Gender = Voter.Gender;
        existing.MobileNumber = Voter.MobileNumber;
        existing.Address = Voter.Address;
        existing.BoothNumber = Voter.BoothNumber;
        existing.WardNumber = Voter.WardNumber;
        existing.PannaNumber = Voter.PannaNumber;
        existing.SerialNumber = Voter.SerialNumber;
        existing.Sentiment = Voter.Sentiment;
        existing.Notes = Voter.Notes;

        await _db.SaveChangesAsync();
        TempData["Message"] = "Voter updated successfully.";
        return RedirectToPage("/Voters/Details", new { id = Voter.Id });
    }
}
