using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Providers.Interfaces;
using OllamaWebuiBackend.Services.Providers.Models;
using System.Net;
using OllamaWebuiBackend.Common;
using OpenAI.Images;
using System.ClientModel;
using OpenAI;

namespace OllamaWebuiBackend.Services.Providers;

public class OpenAiImageGenerationProvider : IImageGenerationProvider
{
    public ProviderType Type => ProviderType.OpenAi;

    public async Task<ImageGenerationResponse> GenerateImageAsync(ImageGenerationRequest request, string? apiKey,
        string? apiUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Model))
            throw new ApiException("Model is required for OpenAI image generation.", HttpStatusCode.BadRequest);
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new ApiException("API key is required for OpenAI.", HttpStatusCode.BadRequest);

        var imageClient = new ImageClient(request.Model, apiKey);

        var sizeParts = request.Size?.Split('x');
        if (sizeParts?.Length != 2 || !int.TryParse(sizeParts[0], out var width) ||
            !int.TryParse(sizeParts[1], out var height))
        {
            throw new ApiException("Invalid image size format. Expected 'widthxheight'.", HttpStatusCode.BadRequest);
        }

        var options = new ImageGenerationOptions
        {
            Size = new GeneratedImageSize(width, height),
        };

        // Handle different models with their specific options
        if (request.Model == "dall-e-3")
        {
            options.Quality = new GeneratedImageQuality(request.Quality ?? "standard");
            options.Style = new GeneratedImageStyle(request.Style ?? "vivid");
        }
        else if (request.Model == "gpt-image-1")
        {
            // gpt-image-1 supports quality and background options
            if (!string.IsNullOrEmpty(request.Quality))
            {
                options.Quality = new GeneratedImageQuality(request.Quality);
            }
        }

        try
        {
            var images = new List<ImageData>();
            for (int i = 0; i < request.N; i++)
            {
                ClientResult<GeneratedImage> result =
                    await imageClient.GenerateImageAsync(request.Prompt, options, cancellationToken);
                GeneratedImage generatedImage = result.Value;
                images.Add(new ImageData
                {
                    Base64Data = generatedImage.ImageBytes.ToArray(),
                    RevisedPrompt = generatedImage.RevisedPrompt
                });
            }

            return new ImageGenerationResponse
            {
                Images = images
            };
        }
        catch (ApiException)
        {
            throw; // Re-throw the original exception to preserve stack trace and details
        }
        catch (Exception ex)
        {
            throw new ApiException(ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    public async Task<ImageGenerationResponse> EditImageAsync(ImageEditRequest request, string? apiKey, string? apiUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Model))
            throw new ApiException("Model is required for OpenAI image generation.", HttpStatusCode.BadRequest);
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new ApiException("API key is required for OpenAI.", HttpStatusCode.BadRequest);
        
        if (request.ReferenceImages == null || !request.ReferenceImages.Any())
            throw new ApiException("At least one reference image is required for generation.", HttpStatusCode.BadRequest);

        try
        {
            // Use HttpClient directly to support multiple reference images for gpt-image-1
            // This is image GENERATION with reference images, not editing
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            using var formData = new MultipartFormDataContent();
            
            // Add the model
            formData.Add(new StringContent(request.Model), "model");
            
            // Add the prompt
            formData.Add(new StringContent(request.Prompt), "prompt");
            
            // Add all reference images - these are REFERENCES for generation, not images to edit
            for (int i = 0; i < request.ReferenceImages.Count; i++)
            {
                var bytes = request.ReferenceImages[i];
                var imageContent = new ByteArrayContent(bytes);
                imageContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
                formData.Add(imageContent, "image[]", $"reference_{i}.png");
            }

            // Use the /v1/images/edits endpoint for gpt-image-1 with reference images
            var response = await httpClient.PostAsync("https://api.openai.com/v1/images/edits", formData, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new ApiException($"OpenAI API error: {response.StatusCode} - {errorContent}", HttpStatusCode.BadRequest);
            }

            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            var responseJson = System.Text.Json.JsonDocument.Parse(responseContent);
            
            // Extract the generated image data
            var dataArray = responseJson.RootElement.GetProperty("data");
            var firstImage = dataArray.EnumerateArray().First();
            var b64Json = firstImage.GetProperty("b64_json").GetString();
            
            if (string.IsNullOrEmpty(b64Json))
            {
                throw new ApiException("No image data received from OpenAI API.", HttpStatusCode.InternalServerError);
            }

            var imageBytes = Convert.FromBase64String(b64Json);
            
            return new ImageGenerationResponse
            {
                Images = new List<ImageData>
                {
                    new ImageData
                    {
                        Base64Data = imageBytes,
                        RevisedPrompt = request.Prompt // OpenAI doesn't return revised prompt for this endpoint
                    }
                }
            };
        }
        catch (ApiException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new ApiException(ex.Message, HttpStatusCode.InternalServerError);
        }
    }
}