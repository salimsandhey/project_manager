import nodemailer from 'nodemailer';
export const sendInviteEmail = async(to,link)=>{
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth:{
            user: process.env.MAIL,
            pass: process.env.PASS
        }
    });
    const mailOptions = {
        from: "'TaskManager' <no-reply@taskmanager.com>",
        to,
        subject: "You're invited to join a team!",
        html: `
            <p>You've been invited to join a team on TaskManager.</p>
            <p><a href="${link}">Click here to register</a></p>
            <p>This link expires in 24 hours.</p>
            `
    };
    await transporter.sendMail(mailOptions);
};