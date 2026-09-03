import config from "../config";
import transporter from "../lib/nodemailer";

interface BaseEmailTemplateOptions {
  title: string;
  description: string;

  // Action link
  link?: string;
  actionText?: string;

  greeting?: string;
  showSecurityNotice?: boolean;
}

interface NoVerificationCode {
  verificationCode?: never;
  codeLabel?: never;
  codeExpiresIn?: never;
}

interface WithVerificationCode {
  verificationCode: string;
  codeLabel: string;
  codeExpiresIn: string;
}

export type EmailTemplateOptions = BaseEmailTemplateOptions &
  (NoVerificationCode | WithVerificationCode);

export type SendEmailOptions = EmailTemplateOptions & {
  to: string;
  subject: string;
};

const EMAIL = {
  brand: "Blood AidX",
  logoUrl: config.logo,
  websiteDescription:
    "Connecting people through blood donation and helping save lives.",

  footerTitle: "Blood AidX",
  footerDescription:
    "Your kindness can give someone hope.<br />Together, we help save lives.",

  colors: {
    primary: "#dc2626",
    primaryDark: "#b91c1c",
    primaryLight: "#fef2f2",
    primaryBorder: "#fecaca",

    header: "#111827",
    headerSecondary: "#1f2937",

    background: "#f8fafc",
    surface: "#ffffff",

    heading: "#111827",
    text: "#475569",
    muted: "#64748b",
    light: "#94a3b8",

    border: "#e5e7eb",

    securityBackground: "#fff7ed",
    securityBorder: "#fed7aa",
    securityHeading: "#9a3412",
    securityText: "#c2410c",

    successBackground: "#f0fdf4",
    successBorder: "#bbf7d0",
    successText: "#166534",
  },
} as const;

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const escapeAttribute = (value: string): string => {
  return escapeHtml(value);
};

const createPreheader = (): string => {
  return `
    <div
      style="
        display:none;
        max-height:0;
        max-width:0;
        overflow:hidden;
        opacity:0;
        color:transparent;
        font-size:1px;
        line-height:1px;
      "
    >
      ${EMAIL.brand} — connecting people through blood donation
      and helping save lives.
    </div>
  `;
};

const createHeader = (): string => {
  const logoUrl = escapeAttribute(EMAIL.logoUrl);

  return `
    <tr>
      <td
        align="center"
        style="
          background:${EMAIL.colors.header};
          padding:36px 24px 32px;
        "
      >
        <img
          src="${logoUrl}"
          alt="${EMAIL.brand}"
          width="75"
          style="
            display:block;
            width:75px;
            max-width:100%;
            height:auto;
            margin:0 auto;
            border:0;
            outline:none;
            text-decoration:none;
          "
        />

        <p
          style="
            margin:16px 0 0;
            padding:0;
            font-size:13px;
            line-height:20px;
            color:#d1d5db;
          "
        >
          ${EMAIL.websiteDescription}
        </p>
      </td>
    </tr>

    <tr>
      <td
        style="
          height:5px;
          background:${EMAIL.colors.primary};
          font-size:0;
          line-height:0;
        "
      >
        &nbsp;
      </td>
    </tr>
  `;
};

const createActionButton = (
  link: string | undefined,
  actionText: string,
): string => {
  if (!link) {
    return "";
  }

  const safeLink = escapeAttribute(link);
  const safeActionText = escapeHtml(actionText);

  return `
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      role="presentation"
    >
      <tr>
        <td
          align="center"
          style="
            padding:32px 0 24px;
          "
        >
          <a
            href="${safeLink}"
            target="_blank"
            style="
              display:inline-block;
              background:${EMAIL.colors.primary};
              border:1px solid ${EMAIL.colors.primary};
              border-radius:10px;
              color:#ffffff;
              font-family:Arial, Helvetica, sans-serif;
              font-size:15px;
              font-weight:700;
              line-height:20px;
              padding:14px 30px;
              text-align:center;
              text-decoration:none;
            "
          >
            ${safeActionText}
          </a>
        </td>
      </tr>
    </table>
  `;
};

const createVerification = (
  verificationCode: string,
  codeExpiresIn: string,
  codeLabel: string,
): string => {
  return `
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
    style="
      margin:28px 0 8px;
      background:#fef2f2;
      border:1px solid #fecaca;
      border-radius:12px;
    "
  >
    <tr>
      <td
        align="center"
        style="padding:22px 20px;"
      >
        <p style="
          margin:0 0 8px;
          font-size:12px;
          line-height:18px;
          font-weight:700;
          letter-spacing:.5px;
          text-transform:uppercase;
          color:#64748b;
        ">
          ${codeLabel}
        </p>

        <p style="
          margin:0;
          font-size:32px;
          line-height:40px;
          font-weight:700;
          letter-spacing:8px;
          color:#dc2626;
        ">
          ${verificationCode}
        </p>

        <p style="
          margin:10px 0 0;
          font-size:12px;
          line-height:18px;
          color:#64748b;
        ">
          This code expires in ${codeExpiresIn}.
        </p>
      </td>
    </tr>
  </table>`;
};

const createSecurityNotice = (): string => {
  return `
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      role="presentation"
      style="
        margin-top:24px;
        background:${EMAIL.colors.securityBackground};
        border:1px solid ${EMAIL.colors.securityBorder};
        border-radius:10px;
      "
    >
      <tr>
        <td
          style="
            padding:16px 18px;
          "
        >
          <p
            style="
              margin:0 0 6px;
              padding:0;
              font-size:13px;
              line-height:20px;
              font-weight:700;
              color:${EMAIL.colors.securityHeading};
            "
          >
            🔐 Security reminder
          </p>

          <p
            style="
              margin:0;
              padding:0;
              font-size:13px;
              line-height:21px;
              color:${EMAIL.colors.securityText};
            "
          >
            If you recognize this activity, no further action
            is required. If you do not recognize it, please
            secure your Blood AidX account immediately.
          </p>
        </td>
      </tr>
    </table>
  `;
};

const createFooter = (): string => {
  const currentYear = new Date().getFullYear();

  return `
    <tr>
      <td
        align="center"
        style="
          background:${EMAIL.colors.background};
          border-top:1px solid ${EMAIL.colors.border};
          padding:30px 24px;
        "
      >
        <p
          style="
            margin:0 0 8px;
            padding:0;
            font-size:15px;
            line-height:22px;
            font-weight:700;
            color:${EMAIL.colors.heading};
          "
        >
          ${EMAIL.footerTitle}
        </p>

        <p
          style="
            margin:0;
            padding:0;
            font-size:13px;
            line-height:21px;
            color:${EMAIL.colors.muted};
          "
        >
          ${EMAIL.footerDescription}
        </p>

        <p
          style="
            margin:18px 0 0;
            padding:0;
            font-size:12px;
            line-height:18px;
            color:${EMAIL.colors.light};
          "
        >
          © ${currentYear} ${EMAIL.brand}.
          <br />
          All rights reserved.
        </p>
      </td>
    </tr>
  `;
};

export const emailTemplate = ({
  title,
  description,
  link,
  actionText = "Continue",
  greeting = "🩸 Welcome to the Blood AidX community!",
  verificationCode,
  codeLabel,
  codeExpiresIn,
  showSecurityNotice = true,
}: EmailTemplateOptions): string => {
  const isVerification = Boolean(
    verificationCode && codeLabel && codeExpiresIn,
  );
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeGreeting = escapeHtml(greeting);
  const actionButton = link ? createActionButton(link, actionText) : "";

  const verification = isVerification
    ? createVerification(verificationCode!, codeLabel!, codeExpiresIn!)
    : "";

  const securityNotice = showSecurityNotice ? createSecurityNotice() : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <meta
          http-equiv="Content-Type"
          content="text/html; charset=UTF-8"
        />

        <meta
          name="color-scheme"
          content="light"
        />

        <meta
          name="supported-color-schemes"
          content="light"
        />

        <title>${EMAIL.brand}</title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          width:100%;
          background:${EMAIL.colors.background};
          font-family:Arial, Helvetica, sans-serif;
          color:${EMAIL.colors.text};
        "
      >
        ${createPreheader()}

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          role="presentation"
          style="
            width:100%;
            margin:0;
            padding:0;
            background:${EMAIL.colors.background};
          "
        >
          <tr>
            <td
              align="center"
              style="
                padding:40px 16px;
              "
            >
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                role="presentation"
                style="
                  width:100%;
                  max-width:580px;
                  margin:0 auto;
                  background:${EMAIL.colors.surface};
                  border:1px solid ${EMAIL.colors.border};
                  border-radius:16px;
                  overflow:hidden;
                "
              >
                ${createHeader()}

                <!-- Main Content -->
                <tr>
                  <td
                    style="
                      padding:40px 36px 36px;
                    "
                  >
                    <!-- Greeting -->
                    <p
                      style="
                        margin:0 0 12px;
                        padding:0;
                        font-size:14px;
                        line-height:22px;
                        color:${EMAIL.colors.muted};
                      "
                    >
                      ${safeGreeting}
                    </p>

                    <!-- Title -->
                    <h1
                      style="
                        margin:0 0 18px;
                        padding:0;
                        font-size:26px;
                        line-height:34px;
                        font-weight:700;
                        color:${EMAIL.colors.heading};
                      "
                    >
                      ${safeTitle}
                    </h1>

                    <!-- Description -->
                    <p
                      style="
                        margin:0;
                        padding:0;
                        font-size:15px;
                        line-height:27px;
                        color:${EMAIL.colors.text};
                      "
                    >
                      ${safeDescription}
                    </p>

                    ${verification}

                    <!-- Action -->
                    ${actionButton}

                    <!-- Security -->
                    ${securityNotice}
                  </td>
                </tr>

                ${createFooter()}
              </table>

              <!-- Automated Message -->
              <p
                style="
                  max-width:580px;
                  margin:18px auto 0;
                  padding:0 16px;
                  font-size:11px;
                  line-height:18px;
                  text-align:center;
                  color:${EMAIL.colors.light};
                "
              >
                This is an automated email from ${EMAIL.brand}.
                Please do not reply unless instructed.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const sendEmail = async ({
  to,
  subject,
  title,
  description,
  link,
  actionText,
  greeting,
  verificationCode,
  codeLabel,
  codeExpiresIn,
  showSecurityNotice,
}: SendEmailOptions): Promise<{ success: true }> => {
  const html = emailTemplate({
    title,
    description,
    ...(link !== undefined ? { link } : {}),
    ...(actionText !== undefined ? { actionText } : {}),
    ...(greeting !== undefined ? { greeting } : {}),
    ...(verificationCode !== undefined ? { verificationCode } : {}),
    ...(codeLabel !== undefined ? { codeLabel } : {}),
    ...(codeExpiresIn !== undefined ? { codeExpiresIn } : {}),
    ...(showSecurityNotice !== undefined ? { showSecurityNotice } : {}),
  });

  try {
    await transporter.sendMail({
      from: {
        name: EMAIL.brand,
        address: config.nodemailer_user,
      },
      to,
      replyTo: config.nodemailer_user,
      subject: `${EMAIL.brand} - ${subject}`,
      text: description,
      html,
      headers: {
        "X-Priority": "3",
        "X-Mailer": `${EMAIL.brand} Mailer`,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Send Email Error]:", error);

    throw new Error("Email sending failed", {
      cause: error,
    });
  }
};
