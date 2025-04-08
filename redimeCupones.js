import runQuery from '../getBQ.js';
import { HEADERSPETCOMPLETE, HEADERSPUSHWALLIA } from '../../../constants/keys.js';
import axios from 'axios';
import nodemailer from 'nodemailer';

/*
Este servicio redimira todos los cupones utilizados en Teamwork para la promoción de Grooming

Envia un correo con el total de cupones redimidos
*/

// Configura el transporte de correo
let transporter = nodemailer.createTransport({
  host: "petco-com-mx.mail.protection.outlook.com", // usa el servicio de Gmail, puedes cambiarlo si usas otro servicio
  port: 25
});

// Envia el correo
async function sendEmail(message) {
  let mailOptions = {
    from: "cuponescroncdp@petco.com.mx",
    to: "aballesteros@petco.com.mx;adgonzalez@petco.com.mx",
    subject: "Redención de cupones BigQuery a redimeCuponesCRM",
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}


const inicio = async () => {
    // Consulta que busca promociones específicas y filtra solo por cupones usados en el último día
    const queryBQ =  `SELECT
    cupon.CouponPromo as idPromo,
    SUBSTR(cupon.CouponNo, 7, 18) AS idClubPetco,
    FROM \`petco-prod01-twc.external_datamart_1.Coupon_view\` AS cupon
    WHERE CouponPromo in ('103351','103352','103353') AND CouponCurrentStatus = 'Used'
    AND DATE(cupon.LastRedemptionDate) >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)`;

    const cupones = await runQuery(queryBQ);
    console.log(cupones);
    const totalCupones = cupones.length
    console.log(totalCupones);
    if (cupones.length > 0) {

        for (let cupon of cupones) {
            const body = { idPromo : cupon.idPromo, idClubPetco : cupon.idClubPetco };
            try {
                const result = await axios.post(
                    "https://petcomplete.petco.com.mx/cdp/redimeCuponesCRM",
                    body,
                    HEADERSPETCOMPLETE
                  );
                console.log(result.data);
            } catch (error) {
                console.log(error);
            }
        }
        await sendEmail(`Se borraron ${totalCupones} de BigQuery a redimeCuponesCRM.`);
        return;
    } else {
        await sendEmail("No hay cupones para redimir");
    }
}
inicio();