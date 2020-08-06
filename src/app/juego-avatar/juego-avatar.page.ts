import { Component, OnInit, ViewChild } from '@angular/core';
import { PeticionesAPIService, SesionService } from '../servicios/index';
import { CalculosService } from '../servicios/calculos.service';
import { NavController, IonContent, AlertController } from '@ionic/angular';
import { Alumno, Equipo, Juego, Punto, Nivel, AlumnoJuegoDePuntos, EquipoJuegoDePuntos,
  TablaAlumnoJuegoDePuntos, TablaEquipoJuegoDePuntos, JuegoDeAvatar, AlumnoJuegoDeAvatar } from '../clases/index';

import * as URL from '../URLs/urls';
import { ModalController } from '@ionic/angular';
import {AvatarEditorPage} from '../avatar-editor/avatar-editor.page';
import { getTreeMultipleDefaultNodeDefsError } from '@angular/cdk/tree';

@Component({
  selector: 'app-juego-avatar',
  templateUrl: './juego-avatar.page.html',
  styleUrls: ['./juego-avatar.page.scss'],
})
export class JuegoAvatarPage implements OnInit {

  alumno: Alumno;
  InfoMiAlumno: AlumnoJuegoDeAvatar;
  juegoSeleccionado: JuegoDeAvatar;
  alumnosDelJuego: Alumno[];
  inscripcionesAlumnosJuegodeAvatar: AlumnoJuegoDeAvatar[];
  criterios: Array<{nombre: string, criterio: string}>;
  imagenSilueta: any;
  inscripcionAlumnoJuegoAvatar: AlumnoJuegoDeAvatar;
  tieneAvatar = false;
  interval;
  imagenesAvatares = URL.ImagenesAvatares;
  audioAvatar;
  tieneVoz = false;

  constructor(
    private calculos: CalculosService,
    public navCtrl: NavController,
    private sesion: SesionService,
    private peticionesAPI: PeticionesAPIService,
    public modalController: ModalController,
    public alertController: AlertController,
  ) { }

  ngOnInit() {
    this.juegoSeleccionado = this.sesion.DameJuegoAvatar();
    this.alumno = this.sesion.DameAlumno();
    if (this.juegoSeleccionado.Modo === 'Individual') {
      this.peticionesAPI.DameInscripcionAlumnoJuegoDeAvatar (this.juegoSeleccionado.id, this.alumno.id)
      .subscribe (inscripcion => {
        this.inscripcionAlumnoJuegoAvatar = inscripcion[0];
        if (this.inscripcionAlumnoJuegoAvatar.Silueta !== undefined) {
          this.tieneAvatar = true;
          console.log ('tiene avatar');
          console.log (this.inscripcionAlumnoJuegoAvatar);
          if ((this.inscripcionAlumnoJuegoAvatar.Privilegios[4]) && (this.inscripcionAlumnoJuegoAvatar.Voz)) {
            this.tieneVoz = true;
            this.audioAvatar = URL.AudiosAvatares + this.inscripcionAlumnoJuegoAvatar.Voz;
          }
        }
        this.PrepararCriterios();
      });
     } else {
       // De momento no hay avatar de equipo
     }
  }


  PrepararCriterios() {
    this.criterios = [
      {nombre: 'Complemento 1', criterio: this.juegoSeleccionado.CriteriosPrivilegioComplemento1},
      {nombre: 'Complemento 2', criterio: this.juegoSeleccionado.CriteriosPrivilegioComplemento2},
      {nombre: 'Complemento 3', criterio: this.juegoSeleccionado.CriteriosPrivilegioComplemento3},
      {nombre: 'Complemento 4', criterio: this.juegoSeleccionado.CriteriosPrivilegioComplemento4},
      {nombre: 'Nota de Voz', criterio: this.juegoSeleccionado.CriteriosPrivilegioVoz},
      {nombre: 'Espíar Compañeros', criterio: this.juegoSeleccionado.CriteriosPrivilegioVerTodos}

    ]
  }
  async AbreEditorAvatar() {

    this.sesion.TomaInscripcionAlumno(this.inscripcionAlumnoJuegoAvatar);
    // abrimos la página del editor de forma modal porque interesa recoger el resultado 
    // para actualizar el avatar en esta página
    const modal = await this.modalController.create({
      component: AvatarEditorPage,
      cssClass: 'my-custom-class',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    // En data me devuelve dos cosas: si ha habido cambio en el avatar y, 
    // en caso afirmativo, la inscripcion que contiene el avatar cambiado
    if (data.hayCambio) {
      this.tieneAvatar = true;
      this.inscripcionAlumnoJuegoAvatar = data.inscripcion;
    }
  }

  VerAvatares() {
    this.navCtrl.navigateForward('/ver-avatares-grupo');
  }

  // Activa la función SeleccionarInfoFamilia
  ActivarInput() {
    console.log('Activar input');
    document.getElementById('inputVoz').click();
}

// Par abuscar el fichero JSON que contiene la info de la familia que se va
// a cargar desde ficheros
async SeleccionarFicheroVoz($event) {

    const file = $event.target.files[0];
    if (this.inscripcionAlumnoJuegoAvatar.Voz) {
      // borro el fichero de audio de la voz anterior
      this.peticionesAPI.BorraAudioAvatar (this.inscripcionAlumnoJuegoAvatar.Voz).subscribe();
    }

    this.inscripcionAlumnoJuegoAvatar.Voz = file.name;
    this.peticionesAPI.ModificaInscripcionAlumnoJuegoDeAvatar (this.inscripcionAlumnoJuegoAvatar)
    .subscribe ();
    const formDataOpcion = new FormData();
    formDataOpcion.append(file.fileName, file);
    this.peticionesAPI.PonAudioAvatar(formDataOpcion)
    .subscribe(async () => {
      this.tieneVoz = true;
      this.audioAvatar = URL.AudiosAvatares + this.inscripcionAlumnoJuegoAvatar.Voz;
      const alert2 = await this.alertController.create({
        cssClass: 'my-custom-class',
        header: 'voz asignada con exito',
        buttons: ['OK']
      });
      await alert2.present();
    });
}

QuitaVoz() {
  if (this.inscripcionAlumnoJuegoAvatar.Voz) {
    // borro el fichero de audio de la voz anterior
    this.peticionesAPI.BorraAudioAvatar (this.inscripcionAlumnoJuegoAvatar.Voz).subscribe();
    this.inscripcionAlumnoJuegoAvatar.Voz = undefined;
    this.peticionesAPI.ModificaInscripcionAlumnoJuegoDeAvatar (this.inscripcionAlumnoJuegoAvatar)
    .subscribe ();
    this.tieneVoz = false;
  }

}



}
