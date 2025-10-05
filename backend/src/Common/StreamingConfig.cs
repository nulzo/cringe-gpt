namespace OllamaWebuiBackend.Common;

public class StreamingConfig
{
    public const string SectionName = "Streaming";
    
    /// <summary>
    /// Target size for each chunk in characters (default: 3 for fast streaming)
    /// </summary>
    public int TargetChunkSize { get; set; } = 3;
    
    /// <summary>
    /// Target interval between chunks in milliseconds (default: 5ms for fast streaming)
    /// </summary>
    public int TargetIntervalMs { get; set; } = 5;
    
    /// <summary>
    /// Maximum buffer size before forcing emission (default: 100 characters)
    /// </summary>
    public int MaxBufferSize { get; set; } = 100;
    
    /// <summary>
    /// Whether to enable smart word boundary breaking (default: true)
    /// </summary>
    public bool EnableSmartBreaking { get; set; } = true;
    
    /// <summary>
    /// Whether to enable adaptive timing based on buffer state (default: true)
    /// </summary>
    public bool EnableAdaptiveTiming { get; set; } = true;
    
    /// <summary>
    /// Minimum chunk size for word boundary breaking (default: 1)
    /// </summary>
    public int MinChunkSize { get; set; } = 1;
    
    /// <summary>
    /// Maximum chunk size variance for natural streaming (default: 2)
    /// </summary>
    public int ChunkSizeVariance { get; set; } = 2;
    
    /// <summary>
    /// Enable variable chunk sizes for more natural streaming (default: true)
    /// </summary>
    public bool EnableVariableChunkSize { get; set; } = true;
    
    /// <summary>
    /// Delay for first chunk to start streaming immediately (default: 0ms)
    /// </summary>
    public int FirstChunkDelayMs { get; set; } = 0;
    
    /// <summary>
    /// Speed up factor when input stream is completed (default: 2.0)
    /// </summary>
    public double EndOfStreamSpeedupFactor { get; set; } = 2.0;
}