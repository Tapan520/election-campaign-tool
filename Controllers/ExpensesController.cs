using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nirvachak_AI.Domain.Entities;
using Nirvachak_AI.Domain.Enums;
using Nirvachak_AI.Infrastructure.Data;
using Nirvachak_AI.Models.Api;

namespace Nirvachak_AI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class ExpensesController : ApiBaseController
{
    private readonly AppDbContext _db;

    public ExpensesController(AppDbContext db) => _db = db;

    [HttpGet]
    [ProducesResponseType(typeof(List<ExpenseListItem>), 200)]
    public async Task<IActionResult> GetExpenses([FromQuery] string? category)
    {
        var cId = GetConstituencyId();
        var query = _db.Expenses.AsQueryable();
        if (cId.HasValue) query = query.Where(e => e.ConstituencyId == cId.Value);
        if (!string.IsNullOrEmpty(category) && Enum.TryParse<ExpenseCategory>(category, out var cat))
            query = query.Where(e => e.Category == cat);

        var items = await query
            .OrderByDescending(e => e.ExpenseDate)
            .Select(e => new ExpenseListItem(
                e.Id, e.Description, e.Category.ToString(), e.Amount,
                e.ExpenseDate, e.PayeeName, e.VoucherNumber,
                e.IsECCompliant, e.ApprovedByName))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResult), 200)]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest req)
    {
        var cId = GetConstituencyId();
        if (!cId.HasValue) return BadRequest(new ApiResult(false, "No constituency assigned."));

        if (!Enum.TryParse<ExpenseCategory>(req.Category, out var cat))
            return BadRequest(new ApiResult(false, "Invalid category."));

        var expense = new Expense
        {
            Description = req.Description,
            Category = cat,
            Amount = req.Amount,
            ExpenseDate = req.ExpenseDate,
            PayeeName = req.PayeeName,
            VoucherNumber = req.VoucherNumber,
            Notes = req.Notes,
            ConstituencyId = cId.Value,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();
        return Ok(new ApiResult(true, "Expense recorded."));
    }
}
