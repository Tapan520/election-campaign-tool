using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Nirvachak_AI.Domain.Entities;
using Nirvachak_AI.Domain.Enums;
using Nirvachak_AI.Infrastructure.Data;

namespace Nirvachak_AI.Pages.Booths;

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
    public Booth? Booth { get; set; }

    public async Task<IActionResult> OnGetAsync(int id)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user?.Role == UserRole.FieldWorker || user?.Role == UserRole.BoothAgent)
            return Forbid();
        Booth = await _db.Booths.FindAsync(id);
        if (Booth == null) return NotFound();
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user?.Role == UserRole.FieldWorker || user?.Role == UserRole.BoothAgent)
            return Forbid();
        if (!ModelState.IsValid) return Page();
        var existing = await _db.Booths.FindAsync(Booth!.Id);
        if (existing == null) return NotFound();

        existing.BoothNumber = Booth.BoothNumber;
        existing.BoothName = Booth.BoothName;
        existing.Address = Booth.Address;
        existing.WardNumber = Booth.WardNumber;
        existing.AssignedAgentName = Booth.AssignedAgentName;
        existing.AssignedAgentPhone = Booth.AssignedAgentPhone;

        await _db.SaveChangesAsync();
        TempData["Message"] = "Booth updated successfully.";
        return RedirectToPage("/Booths/Index");
    }
}
