namespace ElectionCampaignTool.Infrastructure.Services;

/// <summary>
/// Generates PWA icon PNG files at startup using pure C# (no System.Drawing,
/// cross-platform — works on Railway Linux containers).
/// </summary>
public static class PwaIconGenerator
{
    // Brand colours
    private static readonly byte[] BgDark  = [0x1a, 0x1f, 0x2e]; // #1a1f2e
    private static readonly byte[] BgBlue  = [0x3b, 0x5b, 0xdb]; // #3b5bdb
    private static readonly byte[] Yellow  = [0xf5, 0x9f, 0x00]; // #f59f00
    private static readonly byte[] White   = [0xff, 0xff, 0xff]; // #ffffff

    public static void EnsureIconsExist(string wwwrootPath)
    {
        var iconsDir = Path.Combine(wwwrootPath, "icons");
        Directory.CreateDirectory(iconsDir);

        GenerateIfMissing(Path.Combine(iconsDir, "icon-192.png"), 192);
        GenerateIfMissing(Path.Combine(iconsDir, "icon-512.png"), 512);
        GenerateIfMissing(Path.Combine(wwwrootPath, "favicon.png"), 32);
    }

    private static void GenerateIfMissing(string filePath, int size)
    {
        if (File.Exists(filePath)) return;
        var pixels = DrawIcon(size);
        var png    = EncodePng(pixels, size, size);
        File.WriteAllBytes(filePath, png);
    }

    // ?? Drawing ???????????????????????????????????????????????

    private static byte[] DrawIcon(int size)
    {
        var pixels = new byte[size * size * 4];

        void SetPixel(int x, int y, byte[] rgb, byte a = 255)
        {
            if (x < 0 || x >= size || y < 0 || y >= size) return;
            int i = (y * size + x) * 4;
            pixels[i] = rgb[0]; pixels[i+1] = rgb[1];
            pixels[i+2] = rgb[2]; pixels[i+3] = a;
        }

        void FillRect(int x, int y, int w, int h, byte[] rgb, byte a = 255)
        {
            for (int row = y; row < y + h; row++)
                for (int col = x; col < x + w; col++)
                    SetPixel(col, row, rgb, a);
        }

        void FillCircle(int cx, int cy, int radius, byte[] rgb, byte a = 255)
        {
            for (int row = cy - radius; row <= cy + radius; row++)
                for (int col = cx - radius; col <= cx + radius; col++)
                    if ((col - cx) * (col - cx) + (row - cy) * (row - cy) <= radius * radius)
                        SetPixel(col, row, rgb, a);
        }

        // 1. Dark background fill
        FillRect(0, 0, size, size, BgDark);

        // 2. Rounded blue card
        int r = (int)(size * 0.15);
        FillRect(r, 0,       size - 2*r, size,       BgBlue);
        FillRect(0, r,       size,       size - 2*r, BgBlue);
        FillCircle(r,        r,          r, BgBlue);
        FillCircle(size-1-r, r,          r, BgBlue);
        FillCircle(r,        size-1-r,   r, BgBlue);
        FillCircle(size-1-r, size-1-r,   r, BgBlue);

        // 3. Bar chart (5 bars)
        int bottom  = (int)(size * 0.76);
        int bw      = (int)(size * 0.10);
        int gap     = (int)(size * 0.04);
        int totalW  = 5*bw + 4*gap;
        int startX  = (size - totalW) / 2;
        int maxH    = (int)(size * 0.50);

        float[] heights = [0.45f, 0.68f, 1.00f, 0.60f, 0.80f];
        byte[][] colors = [White, White, Yellow, White, White];

        for (int i = 0; i < 5; i++)
        {
            int bh = (int)(maxH * heights[i]);
            int bx = startX + i * (bw + gap);
            int by = bottom - bh;
            FillRect(bx, by, bw, bh, colors[i]);
        }

        // 4. Baseline rule
        int baseH = Math.Max(2, (int)(size * 0.015));
        int pad   = (int)(size * 0.16);
        FillRect(pad, bottom + 1, size - 2*pad, baseH, White, 160);

        return pixels;
    }

    // ?? PNG encoder (pure C#, no external libs) ???????????????

    private static byte[] EncodePng(byte[] rgba, int width, int height)
    {
        // IHDR chunk
        var ihdr = new byte[13];
        WriteUInt32BE(ihdr, 0, (uint)width);
        WriteUInt32BE(ihdr, 4, (uint)height);
        ihdr[8]  = 8;   // bit depth
        ihdr[9]  = 6;   // RGBA colour type
        ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

        // Build raw scanlines with filter-type 0 (None) prefix per row
        var raw = new byte[height * (1 + width * 4)];
        for (int y = 0; y < height; y++)
        {
            int rowStart = y * (1 + width * 4);
            raw[rowStart] = 0; // filter None
            Buffer.BlockCopy(rgba, y * width * 4, raw, rowStart + 1, width * 4);
        }

        var compressed = DeflateStore(raw);

        using var ms = new MemoryStream();
        // PNG signature
        ms.Write([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        WriteChunk(ms, "IHDR", ihdr);
        WriteChunk(ms, "IDAT", compressed);
        WriteChunk(ms, "IEND", []);
        return ms.ToArray();
    }

    private static void WriteChunk(MemoryStream ms, string type, byte[] data)
    {
        var lenBuf  = new byte[4]; WriteUInt32BE(lenBuf, 0, (uint)data.Length);
        var typeBuf = System.Text.Encoding.ASCII.GetBytes(type);
        var crcBuf  = new byte[4];
        WriteUInt32BE(crcBuf, 0, Crc32(typeBuf, data));
        ms.Write(lenBuf); ms.Write(typeBuf); ms.Write(data); ms.Write(crcBuf);
    }

    // Deflate STORE (no compression) with zlib wrapper — valid for PNG IDAT
    private static byte[] DeflateStore(byte[] data)
    {
        const int BLK = 65535;
        using var ms = new MemoryStream();
        ms.Write([0x78, 0x01]); // zlib header: deflate, default compression

        int offset = 0;
        while (offset < data.Length)
        {
            int count = Math.Min(BLK, data.Length - offset);
            bool last = (offset + count >= data.Length);
            ms.WriteByte(last ? (byte)1 : (byte)0);    // BFINAL | BTYPE=00
            ms.Write(BitConverter.GetBytes((ushort)count));
            ms.Write(BitConverter.GetBytes((ushort)(~count & 0xFFFF)));
            ms.Write(data, offset, count);
            offset += count;
        }

        // Adler-32 checksum (big-endian)
        uint adler = Adler32(data);
        ms.Write([(byte)(adler >> 24), (byte)(adler >> 16), (byte)(adler >> 8), (byte)adler]);
        return ms.ToArray();
    }

    private static uint Adler32(byte[] data)
    {
        uint a = 1, b = 0;
        foreach (byte by in data) { a = (a + by) % 65521; b = (b + a) % 65521; }
        return (b << 16) | a;
    }

    private static uint Crc32(byte[] type, byte[] data)
    {
        uint crc = 0xFFFFFFFF;
        foreach (byte by in type)   { crc ^= by; for (int k=0; k<8; k++) crc = (crc & 1) != 0 ? (crc >> 1) ^ 0xEDB88320 : crc >> 1; }
        foreach (byte by in data)   { crc ^= by; for (int k=0; k<8; k++) crc = (crc & 1) != 0 ? (crc >> 1) ^ 0xEDB88320 : crc >> 1; }
        return crc ^ 0xFFFFFFFF;
    }

    private static void WriteUInt32BE(byte[] buf, int offset, uint val)
    {
        buf[offset]   = (byte)(val >> 24); buf[offset+1] = (byte)(val >> 16);
        buf[offset+2] = (byte)(val >>  8); buf[offset+3] = (byte)val;
    }
}
