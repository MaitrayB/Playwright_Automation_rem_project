export const TestData = {
  baseURL: 'https://develop.wewantwaste.co.uk/',
  authCredentials: {
    authUserName: 'developer',
    authPassword: 'WeWantWaste01Jun26'
  },
  credentials: {
    customer: {
      username: 'navin@yopmail.com',
      password: 'P@ssw0rd',
      firstName: 'Navin'
    },
    agent: {
      username: 'mat+admin@remwaste.com',
      password: 'Passport123'
    },
    salesAgent: {
      username: 'qa.salesagent@mailinator.com',
      password: 'Password@123',
      firstName: 'QA',
      lastName: 'SalesAgent'
    },
    supplier: {
      username: 'veton+supplierfinal@remwaste.com',
      password: 'Passport123',
      registrationPassword: 'Password@123'
    },
    pendingVerificationSupplier: {
      username: 'Maitray+nsta@remwaste.com',
      password: 'Password@123'
    },
    pendingBankSetupSupplier: {
      username: 'Laisha_Dooley@mailinator.com',
      password: 'Password@123'
    }
  },

  /** Supplier used when locking commercial contract pricing grids */
  contractPricingSupplier: {
    id: 780,
    displayName: 'LAISHA DOOLEY',
    label: 'LAISHA DOOLEY (#780)',
    search: 'laisha',
    email: 'Laisha_Dooley@mailinator.com',
  },

  customer: {
    credentials: {
      username: 'navin@yopmail.com',
      password: 'P@ssw0rd'
    }
  },

  postcodes: [
    'LE10 2DD',
    'LE11 2LL',
    'LE12',
    'LE13',
    'LE14'
  ],
  WasteType: [
    'Construction Waste',
    'Household Waste',
    'Garden Waste',
    'Commercial Waste'
  ],
  HeavyWaste: [
    'No',
    'Yes'
  ],
  PlasterBoard: [
    'No',
    'Yes'
  ],
  plasterBoardTypes: [
    'take it to the tip myself',
    '1 Tonne Bag',
    'Plasterboard-Only Skip'
  ],
  SkipSize: [
    '4', '5', '6', '8', '14', '16', '20', '10', '12', '40'
  ],
  BookingDay: [
    '29'
  ],
  Placement: [
    'Private Property',
    'Public Property',
    'Grass verge',
    'Not sure'
  ],
  noResultPostcode: 'ZZ99 9ZZ',
  manualAddress: {
    houseNumber: '10',
    streetName: 'Test Street',
    city: 'Test City',
    postcode: 'LE10 2DD'
  }
};