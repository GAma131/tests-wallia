import { HEADERSPUSHWALLIA } from "../../../constants/keys.js";
import axios from "axios";
import { cuponesCDPmodel } from "../../../models/cuponesCDPmodel.js";
import nodemailer from "nodemailer";

/*
Ejecuta consuta a mongo con una diferencia de un día, (si es 19-03 la fecha de la
consulta que ejecuta es 18-03).

Genera un body por cada documento encontrado y lo enviá a CDP

Envia un correo con el proceso realizado.
*/

let transporter = nodemailer.createTransport({
  host: "petco-com-mx.mail.protection.outlook.com", // usa el servicio de Gmail, puedes cambiarlo si usas otro servicio
  port: 25,
});

// Envia el correo
async function sendEmail(message) {
  let mailOptions = {
    from: "cuponescroncdp@petco.com.mx",
    to: "aballesteros@petco.com.mx;adgonzalez@petco.com.mx",
    subject: "Redención de cupones BigQuery a CDP",
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}

const fechaActual = new Date();
fechaActual.setDate(fechaActual.getDate() - 1);
const fechaInicio = fechaActual.toISOString().substring(0, 10);

const inicio = async () => {
  cuponesCDPmodel
    .find({
      fechaUso: {
        $gte: fechaInicio,
      },
    })
    .then(async (cupones) => {
      for (let cupon of cupones) {
        const body = {
          idPromo: parseInt(cupon.idPromo),
          fecha_uso: cupon.fechaUso ? cupon.fechaUso : undefined,
          nombrePromo: cupon.nombrePromo,
          Estatus: cupon.estatus,
          fecha_inicio: cupon.fechaInicio,
          idClubPetco: cupon.idClubPetco,
          idCupon: cupon.idCupon,
          urlImagen: cupon.urlImagen,
          fecha_fin: cupon.fechaExpiracion,
        };
        // console.log(JSON.stringify(body));
        try {
          const result = await axios.post(
            "https://cdp.eu5-prod.gigya.com/api/businessunits/4_-vnru6MqjAdQGQ8GgmHw5A/applications/HJEs65Bv2GPL8vLiDIGzQQ/dataevents/HOxmZ9ILviYuSUKsPH0ocQ/event?secret=Esq/jTYxzYJRtaZ2hcPZJuPXImJyX8mB&userKey=AKDZPd3aIB0z&purposeIds=HLS8MYqjzPqFNpFYSBXtdA",
            body,
          );
          console.log(result.data);
          console.log("Enviado a CDP");
        } catch (error) {
          console.log(error);
        }
      }
      await sendEmail(
        `Se borraron ${cupones.length} de BigQuery a redimeCuponesCRM.`,
      );
    })
    .catch(async (err) => {
      await sendEmail("Error al redimir cupones en CDP", err);
      console.error(err);
    })
    .finally(() => {
      process.exit();
    });
};

inicio();
