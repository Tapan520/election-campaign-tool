namespace ElectionCampaignTool.Domain.Entities;

public class Ward
{
    public int Id { get; set; }
    public string WardNumber { get; set; } = string.Empty;
    public string WardName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ConstituencyId { get; set; }
    public Constituency? Constituency { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
