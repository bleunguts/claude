using System.Text.Json;
using Anthropic.Core;
using Anthropic.Models.Beta.Messages;

namespace Anthropic.Tests.Models.Beta.Messages;

public class BetaCompactionBlockTest : TestBase
{
    [Fact]
    public void FieldRoundtrip_Works()
    {
        var model = new BetaCompactionBlock
        {
            Content = "content",
            EncryptedContent = "encrypted_content",
            Signature = "signature",
        };

        string expectedContent = "content";
        string expectedEncryptedContent = "encrypted_content";
        JsonElement expectedType = JsonSerializer.SerializeToElement("compaction");
        string expectedSignature = "signature";

        Assert.Equal(expectedContent, model.Content);
        Assert.Equal(expectedEncryptedContent, model.EncryptedContent);
        Assert.True(JsonElement.DeepEquals(expectedType, model.Type));
        Assert.Equal(expectedSignature, model.Signature);
    }

    [Fact]
    public void SerializationRoundtrip_Works()
    {
        var model = new BetaCompactionBlock
        {
            Content = "content",
            EncryptedContent = "encrypted_content",
            Signature = "signature",
        };

        string json = JsonSerializer.Serialize(model, ModelBase.SerializerOptions);
        var deserialized = JsonSerializer.Deserialize<BetaCompactionBlock>(
            json,
            ModelBase.SerializerOptions
        );

        Assert.Equal(model, deserialized);
    }

    [Fact]
    public void FieldRoundtripThroughSerialization_Works()
    {
        var model = new BetaCompactionBlock
        {
            Content = "content",
            EncryptedContent = "encrypted_content",
            Signature = "signature",
        };

        string element = JsonSerializer.Serialize(model, ModelBase.SerializerOptions);
        var deserialized = JsonSerializer.Deserialize<BetaCompactionBlock>(
            element,
            ModelBase.SerializerOptions
        );
        Assert.NotNull(deserialized);

        string expectedContent = "content";
        string expectedEncryptedContent = "encrypted_content";
        JsonElement expectedType = JsonSerializer.SerializeToElement("compaction");
        string expectedSignature = "signature";

        Assert.Equal(expectedContent, deserialized.Content);
        Assert.Equal(expectedEncryptedContent, deserialized.EncryptedContent);
        Assert.True(JsonElement.DeepEquals(expectedType, deserialized.Type));
        Assert.Equal(expectedSignature, deserialized.Signature);
    }

    [Fact]
    public void Validation_Works()
    {
        var model = new BetaCompactionBlock
        {
            Content = "content",
            EncryptedContent = "encrypted_content",
            Signature = "signature",
        };

        model.Validate();
    }

    [Fact]
    public void OptionalNullablePropertiesUnsetAreNotSet_Works()
    {
        var model = new BetaCompactionBlock
        {
            Content = "content",
            EncryptedContent = "encrypted_content",
        };

        Assert.Null(model.Signature);
        Assert.False(model.RawData.ContainsKey("signature"));
    }

    [Fact]
    public void OptionalNullablePropertiesUnsetValidation_Works()
    {
        var model = new BetaCompactionBlock
        {
            Content = "content",
            EncryptedContent = "encrypted_content",
        };

        model.Validate();
    }

    [Fact]
    public void OptionalNullablePropertiesSetToNullAreSetToNull_Works()
    {
        var model = new BetaCompactionBlock
        {
            Content = "content",
            EncryptedContent = "encrypted_content",

            Signature = null,
        };

        Assert.Null(model.Signature);
        Assert.True(model.RawData.ContainsKey("signature"));
    }

    [Fact]
    public void OptionalNullablePropertiesSetToNullValidation_Works()
    {
        var model = new BetaCompactionBlock
        {
            Content = "content",
            EncryptedContent = "encrypted_content",

            Signature = null,
        };

        model.Validate();
    }

    [Fact]
    public void CopyConstructor_Works()
    {
        var model = new BetaCompactionBlock
        {
            Content = "content",
            EncryptedContent = "encrypted_content",
            Signature = "signature",
        };

        BetaCompactionBlock copied = new(model);

        Assert.Equal(model, copied);
    }
}
