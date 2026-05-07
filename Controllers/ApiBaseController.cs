using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ElectionCampaignTool.Controllers;

[Produces("application/json")]
public abstract class ApiBaseController : ControllerBase
{
    protected int? GetConstituencyId()
    {
        var claim = User.FindFirst("constituencyId")?.Value;
        return int.TryParse(claim, out var id) && id > 0 ? id : null;
    }

    protected string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? string.Empty;

    protected string GetUserFullName() =>
        User.FindFirst("fullName")?.Value ?? "Unknown";

    protected string GetUserRole() =>
        User.FindFirst("role")?.Value
        ?? User.FindFirst(ClaimTypes.Role)?.Value
        ?? string.Empty;
}
