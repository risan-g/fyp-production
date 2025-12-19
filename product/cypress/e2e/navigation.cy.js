describe("Navigation Flow: Artist to Album", () => {
  it("Should allow a user to click an artist and then select an album", () => {
    // 1. Start at the Artist Page
    cy.visit("http://localhost:3000/artist/0Y5tJX1MQlPlqiwlOH1tJY");

    // 2. Verify we are on the right page
    cy.contains("Travis Scott").should("be.visible");

    // 3. Find an Album and click it
    cy.contains("Albums").should("be.visible");

    // This finds the first image or link inside your discography and clicks it
    cy.get('a[href*="/album/"]').first().click();

    // 4. Verify the Album Page loaded
    // If successful, the URL should now contain '/album/'
    cy.url().should("include", "/album/");

    // Check if the Tracklist table is visible (proving data fetched)
    cy.get("ul").should("be.visible");
    cy.contains("track", { matchCase: false }).should("be.visible");
  });
});
