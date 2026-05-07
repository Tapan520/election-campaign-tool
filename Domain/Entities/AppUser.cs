using Microsoft.AspNetCore.Identity;
using ElectionCampaignTool.Domain.Enums;

namespace ElectionCampaignTool.Domain.Entities;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.FieldWorker;
    public int? ConstituencyId { get; set; }
    public Constituency? Constituency { get; set; }
    public string? AssignedBoothNumbers { get; set; }
    public string? AssignedWard { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
