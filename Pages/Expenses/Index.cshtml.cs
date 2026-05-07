using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Domain.Entities;
using ElectionCampaignTool.Domain.Enums;
using ElectionCampaignTool.Infrastructure.Data;

namespace ElectionCampaignTool.Pages.Expenses;

public class IndexModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public IndexModel(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [BindProperty(SupportsGet = true)]
    public int? SelectedConstituencyId { get; set; }

    public List<Constituency> Constituencies { get; set; } = new();
    public List<Expense> Expenses { get; set; } = new();
    public decimal TotalAmount { get; set; }
    public Dictionary<string, decimal> CategoryTotals { get; set; } = new();

    public async Task<IActionResult> OnGetAsync()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user?.Role == UserRole.FieldWorker || user?.Role == UserRole.BoothAgent)
            return Forbid();
        var isAdmin = user?.Role == UserRole.Admin;

        if (isAdmin)
            Constituencies = await _db.Constituencies.OrderBy(c => c.Name).ToListAsync();

        IQueryable<Expense> query = _db.Expenses
            .Include(e => e.Constituency)
            .OrderByDescending(e => e.ExpenseDate);

        if (isAdmin)
        {
            if (SelectedConstituencyId.HasValue)
                query = query.Where(e => e.ConstituencyId == SelectedConstituencyId);
        }
        else if (user?.ConstituencyId.HasValue == true)
        {
            query = query.Where(e => e.ConstituencyId == user.ConstituencyId);
        }

        Expenses = await query.ToListAsync();
        TotalAmount = Expenses.Sum(e => e.Amount);
        CategoryTotals = Expenses
            .GroupBy(e => e.Category.ToString())
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));
        return Page();
    }
}

