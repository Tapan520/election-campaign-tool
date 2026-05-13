using Microsoft.AspNetCore.Http;
using Nirvachak_AI.Domain.Entities;
using Nirvachak_AI.Infrastructure.Data;

namespace Nirvachak_AI.Infrastructure.Services;

public class AuditService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(
        string userId,
        string userName,
        string action,
        string entityType,
        string? entityId = null,
        string? details = null,
        int? constituencyId = null)
    {
        _db.AuditLogs.Add(BuildEntry(userId, userName, action, entityType, entityId, details, constituencyId));
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Adds an entry to the change tracker without saving — caller must call SaveChangesAsync.
    /// Useful when you want to batch the audit log with another SaveChanges call.
    /// </summary>
    public void Track(
        string userId,
        string userName,
        string action,
        string entityType,
        string? entityId = null,
        string? details = null,
        int? constituencyId = null)
    {
        _db.AuditLogs.Add(BuildEntry(userId, userName, action, entityType, entityId, details, constituencyId));
    }

    private AuditLog BuildEntry(
        string userId, string userName, string action, string entityType,
        string? entityId, string? details, int? constituencyId) => new()
    {
        UserId        = userId,
        UserName      = userName,
        Action        = action,
        EntityType    = entityType,
        EntityId      = entityId,
        Details       = details,
        ConstituencyId = constituencyId,
        IpAddress     = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
        CreatedAt     = DateTime.UtcNow
    };
}
