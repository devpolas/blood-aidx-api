// @ts-nocheck

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type Route = {
  method: HttpMethod;
  path: string;
  name: string;
  public: boolean;
};

type Module = {
  name: string;
  routes: Route[];
};

// Reusable Test Data

const testData = {
  user: {
    name: "Rahim Ahmed",
    email: "rahim@example.com",
    password: "Password@123",
    newPassword: "NewPassword@123",
    gender: "male",
    role: "donor",
    image: "https://example.com/images/rahim.jpg",
  },

  verification: {
    code: "123456",
  },

  profile: {
    phone: "+8801712345678",
    dateOfBirth: "1998-05-15T00:00:00.000Z",
    bio: "Regular blood donor from Dhaka.",
  },

  donor: {
    bloodGroup: "o_positive",
    availability: "available",
    lastDonationAt: "2026-07-10T10:00:00.000Z",
  },

  bloodRequest: {
    bloodGroup: "a_positive",
    unitsRequired: 2,
    priority: "urgent",
    patientName: "Mohammad Karim",
    hospitalName: "Dhaka Medical College Hospital",
    requiredAt: "2026-09-08T10:00:00.000Z",
    expiresAt: "2026-09-09T10:00:00.000Z",
    description: "Urgently required for scheduled surgery.",
  },

  bloodRequestResponse: {
    message:
      "I am available to donate and can reach the hospital within one hour.",
  },

  donation: {
    units: 1,
    donatedAt: "2026-09-07T10:30:00.000Z",
    notes: "Successfully donated one unit.",
  },

  donationVerification: {
    status: "verified",
    verificationNotes: "Donation verified by authorized staff.",
  },

  organization: {
    name: "Dhaka Blood Bank",
    slug: "dhaka-blood-bank",
    type: "blood_bank",
    description: "A blood bank serving patients across Dhaka.",
    phone: "+880212345678",
    email: "contact@dhakabloodbank.org",
    website: "https://dhakabloodbank.org",
  },

  organizationMember: {
    role: "staff",
  },

  location: {
    latitude: "23.8103",
    longitude: "90.4125",
    country: "Bangladesh",
    division: "Dhaka",
    district: "Dhaka",
    city: "Dhaka",
    village: "Dhanmondi",
    postalCode: "1205",
    addressLine: "Road 27, Dhanmondi, Dhaka",
  },

  milestone: {
    name: "First Donation",
    description: "Awarded after completing your first blood donation.",
    donationCount: 1,
    badgeUrl: "https://example.com/badges/first-donation.png",
  },

  report: {
    type: "user",
    reason: "Inappropriate behavior",
    description: "The user repeatedly sent inappropriate messages.",
  },

  review: {
    rating: 5,
    comment: "Very helpful and reliable blood donor.",
  },

  organizationReview: {
    rating: 4,
    comment: "Professional service and helpful staff.",
  },

  conversation: {
    type: "direct",
  },

  message: {
    content: "Hello, I am available to donate blood.",
  },

  statuses: {
    bloodRequest: "partially_fulfilled",
    bloodRequestResponse: "accepted",
    organization: "verified",
    report: "resolved",
    review: "published",
    adminRole: "volunteer",
  },

  ban: {
    reason: "Repeated violation of community guidelines.",
    expiresAt: "2026-10-07T00:00:00.000Z",
  },
};

// Postman Collection Variables

const variables = [
  {
    key: "URL",
    value: "http://localhost:8000",
  },

  {
    key: "accessToken",
    value: "",
  },

  // Reusable authentication data
  {
    key: "email",
    value: testData.user.email,
  },
  {
    key: "password",
    value: testData.user.password,
  },
  {
    key: "resetToken",
    value: "",
  },
  {
    key: "sessionId",
    value: "",
  },

  // Resource IDs
  {
    key: "userId",
    value: "",
  },
  {
    key: "memberUserId",
    value: "",
  },
  {
    key: "donorId",
    value: "",
  },
  {
    key: "requestId",
    value: "",
  },
  {
    key: "responseId",
    value: "",
  },
  {
    key: "donationId",
    value: "",
  },
  {
    key: "organizationId",
    value: "",
  },
  {
    key: "locationId",
    value: "",
  },
  {
    key: "milestoneId",
    value: "",
  },
  {
    key: "certificateId",
    value: "",
  },
  {
    key: "certificateNumber",
    value: "",
  },
  {
    key: "reportId",
    value: "",
  },
  {
    key: "reviewId",
    value: "",
  },
  {
    key: "conversationId",
    value: "",
  },
  {
    key: "messageId",
    value: "",
  },
  {
    key: "notificationId",
    value: "",
  },
];

// Routes

const modules: Module[] = [
  {
    name: "Auth",
    routes: [
      ["GET", "/api/v1/auth/social/google", "Google Sign In", true],
      ["GET", "/api/v1/auth/google/callback", "Google Callback", true],
      ["POST", "/api/v1/auth/signup", "Signup", true],
      ["POST", "/api/v1/auth/signin", "Signin", true],
      ["POST", "/api/v1/auth/verify-email", "Verify Email", true],
      ["POST", "/api/v1/auth/resend-verification", "Resend Verification", true],
      ["POST", "/api/v1/auth/forgot-password", "Forgot Password", true],
      [
        "POST",
        "/api/v1/auth/verify-password-reset",
        "Verify Password Reset",
        true,
      ],
      ["POST", "/api/v1/auth/reset-password", "Reset Password", true],
      ["GET", "/api/v1/auth/me", "Get My Session", false],
      ["POST", "/api/v1/auth/fresh-token", "Fresh Token", true],
      ["POST", "/api/v1/auth/logout", "Logout", false],
      ["POST", "/api/v1/auth/logout-all", "Logout All", false],
      [
        "POST",
        "/api/v1/auth/logout-other-devices",
        "Logout Other Devices",
        false,
      ],
      ["POST", "/api/v1/auth/verify-password", "Verify Password", false],
      ["POST", "/api/v1/auth/change-password", "Change Password", false],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Users",
    routes: [
      ["GET", "/api/v1/users", "Get My User", false],
      ["PATCH", "/api/v1/users", "Update My User", false],
      ["DELETE", "/api/v1/users", "Delete My User", false],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Profiles",
    routes: [
      ["GET", "/api/v1/profiles/me", "Get My Profile", false],
      ["PUT", "/api/v1/profiles/me", "Create / Update My Profile", false],
      ["DELETE", "/api/v1/profiles/me", "Delete My Profile", false],
      ["GET", "/api/v1/profiles/:userId", "Get Profile By User ID", false],
      ["PATCH", "/api/v1/profiles/:userId", "Update Profile By User ID", false],
      [
        "DELETE",
        "/api/v1/profiles/:userId",
        "Delete Profile By User ID",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Donors",
    routes: [
      ["GET", "/api/v1/donors/me", "Get My Donor Profile", false],
      ["PUT", "/api/v1/donors/me", "Create / Update My Donor Profile", false],
      ["DELETE", "/api/v1/donors/me", "Delete My Donor Profile", false],
      ["GET", "/api/v1/donors", "Get Donors", false],
      ["GET", "/api/v1/donors/:donorId", "Get Donor By ID", false],
      ["PATCH", "/api/v1/donors/:donorId", "Update Donor By ID", false],
      ["DELETE", "/api/v1/donors/:donorId", "Delete Donor By ID", false],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Blood Requests",
    routes: [
      ["GET", "/api/v1/blood-requests", "Get Blood Requests", true],
      [
        "GET",
        "/api/v1/blood-requests/:requestId",
        "Get Blood Request By ID",
        true,
      ],
      ["GET", "/api/v1/blood-requests/me", "Get My Blood Requests", false],
      ["POST", "/api/v1/blood-requests", "Create Blood Request", false],
      [
        "PATCH",
        "/api/v1/blood-requests/:requestId",
        "Update Blood Request",
        false,
      ],
      [
        "PATCH",
        "/api/v1/blood-requests/:requestId/status",
        "Update Blood Request Status",
        false,
      ],
      [
        "POST",
        "/api/v1/blood-requests/:requestId/cancel",
        "Cancel Blood Request",
        false,
      ],
      [
        "DELETE",
        "/api/v1/blood-requests/:requestId",
        "Delete Blood Request",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Blood Request Responses",
    routes: [
      ["GET", "/api/v1/blood-request-responses/me", "Get My Responses", false],
      [
        "POST",
        "/api/v1/blood-request-responses/requests/:requestId",
        "Create Response",
        false,
      ],
      [
        "GET",
        "/api/v1/blood-request-responses/requests/:requestId",
        "Get Responses For Request",
        false,
      ],
      [
        "GET",
        "/api/v1/blood-request-responses/:responseId",
        "Get Response By ID",
        false,
      ],
      [
        "PATCH",
        "/api/v1/blood-request-responses/:responseId/status",
        "Update Response Status",
        false,
      ],
      [
        "POST",
        "/api/v1/blood-request-responses/:responseId/cancel",
        "Cancel My Response",
        false,
      ],
      [
        "DELETE",
        "/api/v1/blood-request-responses/:responseId",
        "Delete My Response",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Donations",
    routes: [
      ["GET", "/api/v1/donations/me", "Get My Donations", false],
      ["POST", "/api/v1/donations", "Create Donation", false],
      [
        "POST",
        "/api/v1/donations/:donationId/cancel",
        "Cancel My Donation",
        false,
      ],
      ["GET", "/api/v1/donations", "Get Donations", false],
      ["GET", "/api/v1/donations/:donationId", "Get Donation By ID", false],
      [
        "PATCH",
        "/api/v1/donations/:donationId/verify",
        "Verify Donation",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Admin Users",
    routes: [
      ["GET", "/api/v1/admin/users", "Get Users", false],
      ["GET", "/api/v1/admin/users/:userId", "Get User", false],
      ["PATCH", "/api/v1/admin/users/:userId", "Update User", false],
      ["PATCH", "/api/v1/admin/users/:userId/role", "Change User Role", false],
      ["PATCH", "/api/v1/admin/users/:userId/ban", "Ban User", false],
      ["PATCH", "/api/v1/admin/users/:userId/unban", "Unban User", false],
      ["DELETE", "/api/v1/admin/users/:userId", "Delete User", false],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Organizations",
    routes: [
      ["GET", "/api/v1/organizations", "Get Organizations", true],
      [
        "GET",
        "/api/v1/organizations/:organizationId",
        "Get Organization",
        true,
      ],
      ["GET", "/api/v1/organizations/my", "Get My Organizations", false],
      ["POST", "/api/v1/organizations", "Create Organization", false],
      [
        "PATCH",
        "/api/v1/organizations/:organizationId",
        "Update Organization",
        false,
      ],
      [
        "DELETE",
        "/api/v1/organizations/:organizationId",
        "Delete Organization",
        false,
      ],
      [
        "PATCH",
        "/api/v1/organizations/:organizationId/status",
        "Update Organization Status",
        false,
      ],
      [
        "GET",
        "/api/v1/organizations/:organizationId/members",
        "Get Organization Members",
        false,
      ],
      [
        "POST",
        "/api/v1/organizations/:organizationId/members",
        "Add Organization Member",
        false,
      ],
      [
        "PATCH",
        "/api/v1/organizations/:organizationId/members/:memberUserId",
        "Update Organization Member",
        false,
      ],
      [
        "DELETE",
        "/api/v1/organizations/:organizationId/members/:memberUserId",
        "Remove Organization Member",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Locations",
    routes: [
      ["GET", "/api/v1/locations/me", "Get My Location", false],
      ["POST", "/api/v1/locations", "Create Location", false],
      ["PATCH", "/api/v1/locations/me", "Update My Location", false],
      ["DELETE", "/api/v1/locations/me", "Delete My Location", false],
      ["GET", "/api/v1/locations/:locationId", "Get Location By ID", false],
      [
        "DELETE",
        "/api/v1/locations/:locationId",
        "Delete Location By ID",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Milestones",
    routes: [
      ["GET", "/api/v1/milestones", "Get Milestones", true],
      ["GET", "/api/v1/milestones/:milestoneId", "Get Milestone By ID", true],
      ["GET", "/api/v1/milestones/my", "Get My Milestones", false],
      ["GET", "/api/v1/milestones/user/:userId", "Get User Milestones", false],
      ["POST", "/api/v1/milestones", "Create Milestone", false],
      ["PATCH", "/api/v1/milestones/:milestoneId", "Update Milestone", false],
      ["DELETE", "/api/v1/milestones/:milestoneId", "Delete Milestone", false],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Certificates",
    routes: [
      [
        "GET",
        "/api/v1/certificates/verify/:certificateNumber",
        "Verify Certificate",
        true,
      ],
      ["GET", "/api/v1/certificates/me", "Get My Certificates", false],
      [
        "GET",
        "/api/v1/certificates/me/:certificateId",
        "Get My Certificate By ID",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Reports",
    routes: [
      ["POST", "/api/v1/reports", "Create Report", false],
      ["GET", "/api/v1/reports/me", "Get My Reports", false],
      ["GET", "/api/v1/reports/:reportId", "Get Report", false],
      ["DELETE", "/api/v1/reports/:reportId", "Delete Report", false],
      [
        "PATCH",
        "/api/v1/reports/:reportId/status",
        "Update Report Status",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Reviews",
    routes: [
      ["GET", "/api/v1/reviews/user/:userId", "Get Reviews For User", true],
      [
        "GET",
        "/api/v1/reviews/organization/:organizationId",
        "Get Reviews For Organization",
        true,
      ],
      ["GET", "/api/v1/reviews", "Get My Reviews", false],
      ["POST", "/api/v1/reviews", "Create Review", false],
      ["GET", "/api/v1/reviews/:reviewId", "Get Review By ID", false],
      ["PATCH", "/api/v1/reviews/:reviewId", "Update Review", false],
      ["DELETE", "/api/v1/reviews/:reviewId", "Delete Review", false],
      [
        "PATCH",
        "/api/v1/reviews/:reviewId/status",
        "Update Review Status",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Conversations",
    routes: [
      ["GET", "/api/v1/conversations", "Get My Conversations", false],
      ["POST", "/api/v1/conversations", "Create Conversation", false],
      [
        "POST",
        "/api/v1/conversations/:conversationId/participants",
        "Add Participant",
        false,
      ],
      [
        "DELETE",
        "/api/v1/conversations/:conversationId/participants/:userId",
        "Remove Participant",
        false,
      ],
      [
        "POST",
        "/api/v1/conversations/:conversationId/leave",
        "Leave Conversation",
        false,
      ],
      [
        "GET",
        "/api/v1/conversations/:conversationId",
        "Get Conversation",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Messages",
    routes: [
      ["POST", "/api/v1/messages", "Send Message", false],
      [
        "GET",
        "/api/v1/messages/conversation/:conversationId",
        "Get Conversation Messages",
        false,
      ],
      [
        "PATCH",
        "/api/v1/messages/conversation/:conversationId/read",
        "Mark Conversation Messages As Read",
        false,
      ],
      [
        "GET",
        "/api/v1/messages/conversation/:conversationId/unread-count",
        "Get Unread Message Count",
        false,
      ],
      [
        "DELETE",
        "/api/v1/messages/:messageId/moderate",
        "Moderate Delete Message",
        false,
      ],
      ["GET", "/api/v1/messages/:messageId", "Get Message By ID", false],
      ["PATCH", "/api/v1/messages/:messageId", "Update Message", false],
      ["DELETE", "/api/v1/messages/:messageId", "Delete Message", false],
      [
        "PATCH",
        "/api/v1/messages/:messageId/read",
        "Mark Message As Read",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },

  {
    name: "Notifications",
    routes: [
      ["GET", "/api/v1/notifications", "Get My Notifications", false],
      [
        "GET",
        "/api/v1/notifications/unread",
        "Get Unread Notifications",
        false,
      ],
      [
        "GET",
        "/api/v1/notifications/unread/count",
        "Get Unread Notification Count",
        false,
      ],
      [
        "PATCH",
        "/api/v1/notifications/read-all",
        "Mark All Notifications As Read",
        false,
      ],
      [
        "DELETE",
        "/api/v1/notifications/read",
        "Delete Read Notifications",
        false,
      ],
      [
        "PATCH",
        "/api/v1/notifications/:notificationId/read",
        "Mark Notification As Read",
        false,
      ],
      [
        "DELETE",
        "/api/v1/notifications/:notificationId",
        "Delete Notification",
        false,
      ],
    ].map(([method, path, name, publicRoute]) => ({
      method: method as HttpMethod,
      path,
      name,
      public: publicRoute,
    })),
  },
];

// Path Parameters

const parameterMap: Record<string, string> = {
  ":userId": "userId",
  ":donorId": "donorId",
  ":requestId": "requestId",
  ":responseId": "responseId",
  ":donationId": "donationId",
  ":organizationId": "organizationId",
  ":locationId": "locationId",
  ":milestoneId": "milestoneId",
  ":certificateId": "certificateId",
  ":certificateNumber": "certificateNumber",
  ":reportId": "reportId",
  ":reviewId": "reviewId",
  ":conversationId": "conversationId",
  ":messageId": "messageId",
  ":notificationId": "notificationId",
  ":memberUserId": "memberUserId",
};

// Postman URL

const toPostmanUrl = (path: string): string => {
  let result = path;

  for (const [parameter, variable] of Object.entries(parameterMap)) {
    result = result.replaceAll(parameter, `{{${variable}}}`);
  }

  return `{{URL}}${result}`;
};

// Request Bodies

const requestBodies: Record<string, unknown> = {
  // Auth

  Signup: {
    name: testData.user.name,
    email: "{{email}}",
    password: "{{password}}",
    gender: testData.user.gender,
    role: testData.user.role,
  },

  Signin: {
    email: "{{email}}",
    password: "{{password}}",
  },

  "Verify Email": {
    email: "{{email}}",
    code: testData.verification.code,
  },

  "Resend Verification": {
    email: "{{email}}",
  },

  "Forgot Password": {
    email: "{{email}}",
  },

  "Verify Password Reset": {
    email: "{{email}}",
    code: testData.verification.code,
  },

  "Reset Password": {
    resetToken: "{{resetToken}}",
    password: testData.user.newPassword,
    confirmPassword: testData.user.newPassword,
  },

  Logout: {
    sessionId: "{{sessionId}}",
  },

  "Logout Other Devices": {
    currentSessionId: "{{sessionId}}",
  },

  "Change Password": {
    currentPassword: "{{password}}",
    newPassword: testData.user.newPassword,
    confirmPassword: testData.user.newPassword,
  },

  // Users

  "Update My User": {
    name: testData.user.name,
    image: testData.user.image,
    gender: testData.user.gender,
  },

  // Profiles

  "Create / Update My Profile": {
    phone: testData.profile.phone,
    dateOfBirth: testData.profile.dateOfBirth,
    bio: testData.profile.bio,
  },

  "Update Profile By User ID": {
    phone: testData.profile.phone,
    dateOfBirth: testData.profile.dateOfBirth,
    bio: testData.profile.bio,
  },

  // Donors

  "Create / Update My Donor Profile": {
    bloodGroup: testData.donor.bloodGroup,
    availability: testData.donor.availability,
    lastDonationAt: testData.donor.lastDonationAt,
  },

  "Update Donor By ID": {
    bloodGroup: testData.donor.bloodGroup,
    availability: testData.donor.availability,
    lastDonationAt: testData.donor.lastDonationAt,
  },

  // Blood Requests

  "Create Blood Request": {
    locationId: "{{locationId}}",
    bloodGroup: testData.bloodRequest.bloodGroup,
    unitsRequired: testData.bloodRequest.unitsRequired,
    priority: testData.bloodRequest.priority,
    patientName: testData.bloodRequest.patientName,
    hospitalName: testData.bloodRequest.hospitalName,
    requiredAt: testData.bloodRequest.requiredAt,
    expiresAt: testData.bloodRequest.expiresAt,
    description: testData.bloodRequest.description,
  },

  "Update Blood Request": {
    locationId: "{{locationId}}",
    bloodGroup: testData.bloodRequest.bloodGroup,
    unitsRequired: testData.bloodRequest.unitsRequired,
    priority: testData.bloodRequest.priority,
    patientName: testData.bloodRequest.patientName,
    hospitalName: testData.bloodRequest.hospitalName,
    requiredAt: testData.bloodRequest.requiredAt,
    expiresAt: testData.bloodRequest.expiresAt,
    description: testData.bloodRequest.description,
  },

  "Update Blood Request Status": {
    status: testData.statuses.bloodRequest,
  },

  // Blood Request Responses

  "Create Response": {
    message: testData.bloodRequestResponse.message,
  },

  "Update Response Status": {
    status: testData.statuses.bloodRequestResponse,
  },

  // Donations

  "Create Donation": {
    requestId: "{{requestId}}",
    organizationId: "{{organizationId}}",
    locationId: "{{locationId}}",
    units: testData.donation.units,
    donatedAt: testData.donation.donatedAt,
    notes: testData.donation.notes,
  },

  "Verify Donation": {
    status: testData.donationVerification.status,
    verificationNotes: testData.donationVerification.verificationNotes,
  },

  // Admin Users

  "Update User": {
    name: testData.user.name,
    image: testData.user.image,
    gender: testData.user.gender,
  },

  "Change User Role": {
    role: testData.statuses.adminRole,
  },

  "Ban User": {
    reason: testData.ban.reason,
    expiresAt: testData.ban.expiresAt,
  },

  // Organizations

  "Create Organization": {
    name: testData.organization.name,
    slug: testData.organization.slug,
    type: testData.organization.type,
    locationId: "{{locationId}}",
    description: testData.organization.description,
    phone: testData.organization.phone,
    email: testData.organization.email,
    website: testData.organization.website,
  },

  "Update Organization": {
    name: testData.organization.name,
    slug: testData.organization.slug,
    type: testData.organization.type,
    locationId: "{{locationId}}",
    description: testData.organization.description,
    phone: testData.organization.phone,
    email: testData.organization.email,
    website: testData.organization.website,
  },

  "Update Organization Status": {
    status: testData.statuses.organization,
  },

  "Add Organization Member": {
    userId: "{{memberUserId}}",
    role: testData.organizationMember.role,
  },

  "Update Organization Member": {
    role: "admin",
  },

  // Locations

  "Create Location": {
    latitude: testData.location.latitude,
    longitude: testData.location.longitude,
    country: testData.location.country,
    division: testData.location.division,
    district: testData.location.district,
    city: testData.location.city,
    village: testData.location.village,
    postalCode: testData.location.postalCode,
    addressLine: testData.location.addressLine,
  },

  "Update My Location": {
    latitude: testData.location.latitude,
    longitude: testData.location.longitude,
    country: testData.location.country,
    division: testData.location.division,
    district: testData.location.district,
    city: testData.location.city,
    village: testData.location.village,
    postalCode: testData.location.postalCode,
    addressLine: testData.location.addressLine,
  },

  // Milestones

  "Create Milestone": {
    name: testData.milestone.name,
    description: testData.milestone.description,
    donationCount: testData.milestone.donationCount,
    badgeUrl: testData.milestone.badgeUrl,
  },

  "Update Milestone": {
    name: testData.milestone.name,
    description: testData.milestone.description,
    donationCount: testData.milestone.donationCount,
    badgeUrl: testData.milestone.badgeUrl,
  },

  // Reports

  "Create Report": {
    type: testData.report.type,
    targetId: "{{userId}}",
    reason: testData.report.reason,
    description: testData.report.description,
  },

  "Update Report Status": {
    status: testData.statuses.report,
  },

  // Reviews

  "Create Review": {
    revieweeId: "{{userId}}",
    rating: testData.review.rating,
    comment: testData.review.comment,
  },

  "Update Review": {
    rating: testData.review.rating,
    comment: testData.review.comment,
  },

  "Update Review Status": {
    status: testData.statuses.review,
  },

  // Conversations

  "Create Conversation": {
    type: testData.conversation.type,
    participantIds: ["{{userId}}"],
  },

  "Add Participant": {
    userId: "{{memberUserId}}",
  },

  // Messages

  "Send Message": {
    conversationId: "{{conversationId}}",
    content: testData.message.content,
  },

  "Update Message": {
    content: testData.message.content,
  },
};

// Helpers

const hasRequestBody = (route: Route): boolean => {
  return ["POST", "PUT", "PATCH"].includes(route.method);
};

const getRequestBody = (route: Route): unknown | undefined => {
  return requestBodies[route.name];
};

// Make Postman Request

const makeRequest = (route: Route) => {
  const request: Record<string, unknown> = {
    method: route.method,

    header: [
      {
        key: "Accept",
        value: "application/json",
      },
    ],

    url: toPostmanUrl(route.path),

    description: `${route.method} ${route.path}`,
  };

  // Authentication

  if (!route.public) {
    request.auth = {
      type: "bearer",
      bearer: [
        {
          key: "token",
          value: "{{accessToken}}",
          type: "string",
        },
      ],
    };
  }

  // Request Body

  if (hasRequestBody(route)) {
    const body = getRequestBody(route);

    request.body = {
      mode: "raw",

      raw: body !== undefined ? JSON.stringify(body, null, 2) : "{\n  \n}",

      options: {
        raw: {
          language: "json",
        },
      },
    };
  }

  // Postman Item

  const item: Record<string, unknown> = {
    name: route.name,
    request,
    response: [],
  };

  // Signin → Save Access Token

  if (route.name === "Signin") {
    item.event = [
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: [
            "const json = pm.response.json();",
            "const token = json?.data?.accessToken ?? json?.accessToken;",
            "",
            "if (token) {",
            "  pm.collectionVariables.set('accessToken', token);",
            "  console.log('Access token saved to collection variables.');",
            "}",
          ],
        },
      },
    ];
  }

  return item;
};

// Postman Collection

const collection = {
  info: {
    _postman_id: "b7d0a0c6-0c7d-4b53-9d9a-blood-aidx",

    name: "Blood AIDX API",

    description:
      "Backend/API collection for Blood AIDX generated from the current Express route structure.",

    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },

  // Collection Events

  event: [
    {
      listen: "prerequest",

      script: {
        type: "text/javascript",

        exec: [
          "pm.request.headers.upsert({",
          "  key: 'Accept',",
          "  value: 'application/json'",
          "});",
        ],
      },
    },

    {
      listen: "test",

      script: {
        type: "text/javascript",

        exec: [
          "pm.test('Response is received', function () {",
          "  pm.expect(pm.response.code).to.be.above(0);",
          "});",

          "",

          "pm.test('Response time < 2s', function () {",
          "  pm.expect(pm.response.responseTime).to.be.below(2000);",
          "});",
        ],
      },
    },
  ],

  // Collection Variables

  variable: variables,

  // API Modules

  item: modules.map((module) => ({
    name: module.name,

    item: module.routes.map(makeRequest),
  })),
};

// Generate JSON

const output = resolve(
  process.cwd(),
  "postman",
  "Blood-AIDX.postman_collection.json",
);

mkdirSync(dirname(output), {
  recursive: true,
});

writeFileSync(output, `${JSON.stringify(collection, null, 2)}\n`, "utf8");

// Summary

const routeCount = modules.reduce(
  (total, module) => total + module.routes.length,
  0,
);

const bodyCount = modules.reduce(
  (total, module) =>
    total + module.routes.filter((route) => hasRequestBody(route)).length,
  0,
);

console.log(`Generated ${routeCount} Blood AIDX API routes.`);

console.log(`Generated ${bodyCount} request bodies.`);

console.log(`Output: ${output}`);
