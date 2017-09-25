import { Component } from '@angular/core';
import { Http } from '@angular/http'
import { NavController, LoadingController, ToastController } from 'ionic-angular';
import { CameraOptions, Camera } from '@ionic-native/camera';
import 'rxjs/rx';

import { API_KEY } from './../../CV_API_INFO';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  base64Img = '';
  comment = '';
  CV_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`; // Google cloud vision API

  constructor(public navCtrl: NavController,
    private http: Http,
    private camera: Camera,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController) { }

  onInspect() {
    this.base64Img = '';
    this.comment = '';
    const options: CameraOptions = {
      quality: 60,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      targetHeight: 600,
      saveToPhotoAlbum: false
    };

    this.camera.getPicture(options).then((imageData) => {
      this.base64Img = 'data:image/jpeg;base64,' + imageData;
      this.sendFileToCloudVision(imageData);
    }, (err) => {
      this.toastCtrl.create({
        message: `Error: ${err}`,
        duration: 5000
      }).present();
    });
  }

  sendFileToCloudVision(content) {
    let loading = this.loadingCtrl.create({ content: 'finding cats...' });
    loading.present();

    // Strip out the file prefix when you convert to json.
    const request = {
      requests: [{
        image: {
          content: content
        },
        features: [{
          type: 'LABEL_DETECTION',
          maxResults: 200
        }]
      }]
    };

    this.http.post(this.CV_URL, request)
      .finally(() => {
        loading.dismiss()
        this.camera.cleanup();
      }).subscribe(resp => {
        resp = resp.json();
        this.lookForCats(resp);
      },
      err => {
        this.toastCtrl.create({
          message: `Error: ${err}`,
          duration: 5000
        }).present();
      });
  }

  lookForCats(data) {
    // Default the thing found to the first annotation from GCV
    let thingFound = data.responses[0].labelAnnotations[0].description;
    let isCat = false;

    for (let idx = 0; idx < data.responses[0].labelAnnotations.length; idx++) {
      let label = data.responses[0].labelAnnotations[idx];
      if (label.description.indexOf('cat') !== -1) {
        isCat = true;
        thingFound = label.description;
        break;
      }
    }

    this.comment = isCat ? `You found one! it is a ${thingFound}` : `That's not a cat! That is a ${thingFound}`;
  }
}
