describe('Smoke Tests', () => {
  it('loads the home page successfully', () => {
    cy.visit('/');
    cy.contains('dotwv', { matchCase: false }).should('be.visible');
    cy.get('header').should('be.visible');
  });

  it('renders the sign-in page correctly', () => {
    cy.visit('/sign-in');
    cy.contains('Sign In', { matchCase: false }).should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('renders the sign-up page correctly', () => {
    cy.visit('/sign-up');
    cy.contains('Create Account', { matchCase: false }).should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="text"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('allows public search input', () => {
    cy.intercept('GET', '/api/search*', {
      statusCode: 200,
      body: {
        users: [{ id: 'mock-id', name: 'MockUser', image: null }],
        artists: [],
        albums: []
      }
    }).as('searchReq');

    cy.visit('/');
    cy.get('input[placeholder*="SEARCH"]').type('MockUser');
    cy.wait('@searchReq');
    cy.contains('MockUser', { matchCase: false }).should('be.visible');
  });
});
