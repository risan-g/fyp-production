describe("Artist Search Functionality", () => {
  it("Should search for Travis Scott and load the Artist Page", () => {
    // 1. Visit Homepage
    cy.visit("http://localhost:3000");

    // 2. Type "Travis Scott"
    cy.get('input[placeholder*="Search"]').type("Travis Scott").wait(1000);

    // 3. WAIT for the results to appear
    cy.contains("Travis Scott", { timeout: 10000 }).should("be.visible");

    // 4. CLICK the result
    cy.contains("Travis Scott").click();

    // 5. NOW check the URL
    cy.url({ timeout: 10000 }).should("include", "/artist");
  });
});
