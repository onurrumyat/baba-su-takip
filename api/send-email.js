import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { email, code } = req.body;

    if (!email || !code) return res.status(400).json({ error: 'E-posta veya kod eksik.' });

    // Gmail kullanarak mail gönderme ayarları
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Kendi Gmail adresin (örn: biochefapp@gmail.com)
            pass: process.env.EMAIL_PASS  // Gmail'den alacağın 16 haneli Uygulama Şifresi
        }
    });

    try {
        await transporter.sendMail({
            from: '"Bio-Chef Pro" <noreply@biochef.com>', // Gönderici adı
            to: email, // Kullanıcının girdiği mail adresi
            subject: 'Bio-Chef Doğrulama Kodunuz',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #0F172A; color: #F8FAFC; border-radius: 15px;">
                    <h2 style="color: #10B981;">Bio-Chef Pro'ya Hoş Geldiniz!</h2>
                    <p style="color: #94A3B8;">Kayıt işleminizi tamamlamak için doğrulama kodunuz aşağıdadır:</p>
                    <div style="margin: 20px auto; padding: 15px; background-color: #1E293B; border: 1px solid #334155; border-radius: 10px; width: fit-content;">
                        <h1 style="letter-spacing: 5px; color: #F59E0B; margin: 0;">${code}</h1>
                    </div>
                    <p style="font-size: 0.8rem; color: #64748B;">Bu kodu kimseyle paylaşmayınız.</p>
                </div>
            `
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Mail gönderme hatası:", error);
        return res.status(500).json({ error: 'Mail gönderilemedi.' });
    }
}
