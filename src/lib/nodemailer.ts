import nodemailer from "nodemailer";
import config from "../config";

const transporter = nodemailer.createTransport({
  service: config.nodemailer_service,
  host: config.nodemailer_smtp_host,
  port: Number(config.nodemailer_smtp_port),
  secure: Number(config.nodemailer_smtp_port) === 465,
  auth: {
    user: config.nodemailer_user,
    pass: config.nodemailer_app_password,
  },
});

export default transporter;
