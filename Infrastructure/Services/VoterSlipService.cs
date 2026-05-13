using QRCoder;
using Nirvachak_AI.Domain.Entities;

namespace Nirvachak_AI.Infrastructure.Services;

public class VoterSlipService
{
    public string GenerateQrCodeBase64(Voter voter)
    {
        var data = $"EPIC:{voter.VoterId}|Name:{voter.Name}|Booth:{voter.BoothNumber}|Serial:{voter.SerialNumber}";
        using var qrGenerator = new QRCodeGenerator();
        var qrData = qrGenerator.CreateQrCode(data, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrData);
        var pngBytes = qrCode.GetGraphic(4);
        return Convert.ToBase64String(pngBytes);
    }
}
