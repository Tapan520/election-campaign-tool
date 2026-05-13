namespace Nirvachak_AI.Domain.Entities;

public class AnnouncementAcknowledgement
{
    public int Id { get; set; }
    public int AnnouncementId { get; set; }
    public Announcement Announcement { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime AcknowledgedAt { get; set; } = DateTime.UtcNow;
}
