import axios from "axios";
import {
  HEADERSPETCOMPLETE,
  HEADERSPETCOACH,
  HEADERSPUSHWALLIA,
} from "../constants/TWKEYS.js";
import { cuponesCDPmodel } from "../models/cuponesCDPmodel.js";
import { Promo_dirigida } from "../schemas/CDPSchemaVentel.js";
import moment from "moment";

/*
Función para redimir cupones en el sistema de Petco.

*/

let fecha = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
const redimirCupones = async (req, res) => {
  const { idClubPetco, idPromo } = req.body;

  const promoCodes = {
    103272: "5510322404232405310990000729",
    103275: "5510322404232405310500000759",
    103274: "5510322404232405310990000749",
    103273: "5510322404232405310990000739",
    103345: "5510332405032405310250000459",
    103346: "5510332405032405310250000469",
    103347: "5510332405032405310150000479",
    103348: "5510332405032405310250000489",
    103349: "5510332405032405310800000499",
  };

  async function envio(idClubPetco, promo) {
    let cuponPersonalizado = promo + idClubPetco;
    let promoCode = promoCodes[promo] || cuponPersonalizado;
    await borrarCupon(idClubPetco, promoCode);
    return sendCDP(idClubPetco, promo);
  }

  function borrarCupon(idClubPetco, cupon) {
    let datos = {
      idClubPetco: idClubPetco,
      cuponesCRM: [cupon],
    };
    console.log(datos);
    return axios
      .post(
        "https://app.petco.com.mx/users/deleteCuponesCRM",
        datos,
        HEADERSPETCOACH,
      )
      .then((response) => {
        console.log(response.data);
        return response;
      });
  }

  try {
    await envio(idClubPetco, idPromo);
    console.log("cupon Redimido");
    return res.status(200).json({
      replyCode: 200,
      Status: "OK",
      data: {
        cuponBorrado: idPromo,
        cliente: idClubPetco,
      },
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
};

const sendCDP = async (idClubPetco, promo) => {
  let idCupon = `${promo}${idClubPetco}`;
  let bodyCDP = {
    estatus: "Used",
    fechaUso: fecha,
  };

  try {
    const result = await cuponesCDPmodel.updateOne(
      { idCupon: idCupon },
      bodyCDP,
    );
    const deleteVentel = await Promo_dirigida.deleteMany({
      cliente_id: `00000${idClubPetco}`,
      promo_id: promo,
    });
    return result.data;
  } catch (error) {
    console.log("Error:", error.response.data);
    return error;
  }
};

// }
export { redimirCupones };
