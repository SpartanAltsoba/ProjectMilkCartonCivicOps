import { ApiValidator } from "../../lib/apiClients/validation";

interface CourtCase {
  id: string;
  caseName: string;
  docketNumber: string;
  court: string;
  dateDecided: string;
  status: string;
  summary: string;
}

describe("ApiValidator", () => {
  describe("validateCourtCase", () => {
    it("validates a valid court case", () => {
      const validCourtCase: CourtCase = {
        id: "123",
        caseName: "Test Case",
        docketNumber: "456",
        court: "Test Court",
        dateDecided: "2022-01-01",
        status: "Open",
        summary: "Test summary",
      };

      expect(() => ApiValidator.validateCourtCase(validCourtCase)).not.toThrow();
    });

    it("throws a ValidationError for an invalid court case", () => {
      const invalidCourtCase = {
        id: "123",
        caseName: "Test Case",
        // missing docketNumber
        court: "Test Court",
        dateDecided: "2022-01-01",
        status: "Open",
        summary: "Test summary",
      };

      expect(() => ApiValidator.validateCourtCase(invalidCourtCase)).toThrow(
        ApiValidator.ValidationError
      );
    });

    it("includes validation error details in the thrown error", () => {
      const invalidCourtCase = {
        id: "123",
        caseName: "Test Case",
        // missing docketNumber and court
        dateDecided: "2022-01-01",
        status: "Open",
        summary: "Test summary",
      };

      try {
        ApiValidator.validateCourtCase(invalidCourtCase);
        fail("Expected validation to throw");
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ApiValidator.ValidationError);
        if (error instanceof ApiValidator.ValidationError) {
          expect(error.details).toBeDefined();
          expect(error.message).toContain("docketNumber");
          expect(error.message).toContain("court");
        }
      }
    });

    it("validates all required fields", () => {
      const emptyCase = {};

      try {
        ApiValidator.validateCourtCase(emptyCase);
        fail("Expected validation to throw");
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ApiValidator.ValidationError);
        if (error instanceof ApiValidator.ValidationError) {
          expect(error.message).toContain("ID is required");
          expect(error.message).toContain("Case name is required");
          expect(error.message).toContain("Docket number is required");
          expect(error.message).toContain("Court is required");
          expect(error.message).toContain("Date decided is required");
          expect(error.message).toContain("Status is required");
          expect(error.message).toContain("Summary is required");
        }
      }
    });
  });
});
