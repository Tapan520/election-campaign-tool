using Nirvachak_AI.Domain.Enums;

namespace Nirvachak_AI.Domain.Entities;

public class Constituency
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public ElectionType ElectionType { get; set; }
    public string State { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string? CandidateName { get; set; }
    public string? PartyName { get; set; }
    public string? PartySymbol { get; set; }
    public DateTime ElectionDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Voter> Voters { get; set; } = new List<Voter>();
    public ICollection<Booth> Booths { get; set; } = new List<Booth>();
    public ICollection<Ward> Wards { get; set; } = new List<Ward>();
}
