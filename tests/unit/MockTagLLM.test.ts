import { MockTagLLM } from "../mocks/MockTagLLM";

describe("MockTagLLM", () => {
    it("should generate tags using invoke", async () => {
        const mockTags = ["#test", "#typescript", "#langchain"];
        const llm = new MockTagLLM(mockTags);
        
        const result = await llm.invoke("Test prompt");
        expect(result).toBe(mockTags.join(", "));
    });

    it("should stream tags", async () => {
        const mockTags = ["#test", "#typescript", "#langchain"];
        const llm = new MockTagLLM(mockTags);
        
        const chunks: string[] = [];
        for await (const chunk of await llm.stream("Test prompt")) {
            chunks.push(chunk);
        }
        
        expect(chunks.join("")).toBe(mockTags.map(tag => tag + ", ").join(""));
    });

    it("should provide generation info", async () => {
        const llm = new MockTagLLM();
        const result = await llm.generate(["Test prompt"]);
        
        expect(result.generations).toHaveLength(1);
        expect(result.generations[0][0]).toHaveProperty("generationInfo");
        expect(result.llmOutput).toHaveProperty("tokenUsage");
    });
});
