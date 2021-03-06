import * as React from 'react'
import { IProfileProps, IProfileState} from '../domain/types'
import * as UsersAPI from '../utils/UsersAPI'
import { Spinner, Images, Avatar, ImageButtons } from '../components';

export default class Profile extends React.Component<IProfileProps, IProfileState> {

    private userName = React.createRef<HTMLInputElement>();
    private contactEmail = React.createRef<HTMLInputElement>();
    private firstName = React.createRef<HTMLInputElement>();
    private lastName = React.createRef<HTMLInputElement>();
    private password = React.createRef<HTMLInputElement>();
    private confirm = React.createRef<HTMLInputElement>();
    private aboutMe = React.createRef<HTMLTextAreaElement>();

    private readonly imageTypes: string[];

    constructor(props: IProfileProps){
        super(props);
        this.state = {
            id: 0,
            userName: this.props.user.userName,
            firstName: '',
            lastName: '',
            email: this.props.user.email,
            aboutMe: '',
            aboutMeUpdate: "Tell us a bit about yourself...",
            uploading: false,
            images: [{public_id: "", secure_url: ""}],
            avatar: ''
        }
        this.arrayBufferToBase64 = this.arrayBufferToBase64.bind(this);
        this.imageTypes = ['image/png', 'image/jpeg', 'image/gif'];
    }

    public async componentDidMount(){
        const user = await UsersAPI.getUserProfile({ user: this.props.user })
        let { email, userName } = this.props.user;
        this.setState({
            uploading: false,
            email: user.email ? user.email: email,
            userName: user.user_name ? user.user_name: userName,
            firstName: user.first_name ? user.first_name: '',
            lastName: user.last_name ? user.last_name: '',
            aboutMe: user.about_me ? user.about_me: '',
            avatar: user.avatar ? this.arrayBufferToBase64(this.imageTypes[0], user.avatar.data): undefined
        })
    }

    // public state = {};
    private arrayBufferToBase64(dataType: string, buffer: Int8Array): string {
        // credits:
        // https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
        // https://medium.com/@colinrlly/send-store-and-show-images-with-react-express-and-mongodb-592bc38a9ed
        const base64Flag = `data:${dataType};base64,`;
        let binary = '';
        const bytes = [].slice.call(new Uint8Array(buffer));
        bytes.forEach((b: any) => binary += String.fromCharCode(b));
        return base64Flag + window.btoa(binary);
        }

  // TODO: Include toasts for edge cases
  // public toast = notify.createShowQueue();


  public onChange = (e: any) => { // TODO: define type
      console.log("onChange event: ", e)
      console.log("ev. target: ", e.target)
      console.log("ev. files: ", e.target.files)

      const errs: string[] = [];
      const files = Array.from(e.target.files);
      // console.log("Array files: ", files)

      if (files.length > 3) {
          const msg = 'Only 3 images can be uploaded at a time'
          console.log(msg);
          return
          // return this.toast(msg, 'custom', 2000, toastColor);
      }

      const formData = new FormData(); // modified: lib.dom.d.ts (line: 5196)
      // types: http://www.masteringreactjs.com/2018/04/11/one-neat-typescript-trick-that-saved-the-day/
      files.forEach((file: any, i) => {

          if (this.imageTypes.every(type => file.type !== type)) {
              errs.push(`'${file.type}' is not a supported format`)
          }

          if (file.size > 150000) {
              errs.push(`'${file.name}' is too large, please pick a smaller file`)
          }
          console.log("file: ", file)

          formData.append(i.toString(), file);

      });

      if (errs.length) {
          errs.forEach(err => console.log(err));
          console.log(errs)
          return
          // return errs.forEach(err => this.toast(err, 'custom', 2000, toastColor))
      }

      this.setState({ uploading: true });

      // Will read user's token on backend before uploading to DB.
      formData.append("user", JSON.stringify(this.props.user));

      // Display the File objects
      // formData.forEach(file => console.log("File", file));

      UsersAPI.uploadAvatar(formData)
          .then(imageFile => {
              console.log("images: ", imageFile);

              // const base64Flag = 'data:image/jpeg;base64,';
              // const base64Flag = `data:${types[0]};base64,`;

              this.setState({
                  uploading: false,
                  avatar: this.arrayBufferToBase64(this.imageTypes[0], imageFile.data) // pass object containing buffer
              })
      })
  };

  public removeImage = (id: string) => {
      this.setState({
          // images: this.state.images.filter(image => image.public_id !== id)
          avatar: ''
      })
  };

  public handleUpdateSave = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (this.password) {
          console.warn("Password change is not yet implemented")
      }
      const userData = {
          user: {
              firstName: this.firstName.current!.value ? this.firstName.current!.value: this.state.firstName,
              lastName: this.lastName.current!.value ? this.lastName.current!.value: this.state.lastName,
              userName: this.userName.current!.value ? this.userName.current!.value: this.props.user.userName,
              email: this.props.user.email,
              newEmail: this.contactEmail.current!.value ? this.contactEmail.current!.value: this.props.user.email,
              aboutMe: this.aboutMe.current!.value ? this.aboutMe.current!.value: this.state.aboutMe
          }
      };

      UsersAPI.updateProfile(userData) // Uses "axios" instead of "fetch"
          .then( (response) => {
              console.log("Axios response", response)
              if (response.status === 200){
                  this.setState({
                      id: this.state.id + 1,
                      aboutMe: this.aboutMe.current!.value ? this.aboutMe.current!.value: this.state.aboutMe
                  })
              } else {
                  alert("Profile update failed to send.")
              }
          });
  };

  public render() {

      const { uploading, images, avatar } = this.state;

      const avatarLoader = () => {
          switch(true) {
              case uploading:
                  return <Spinner/>;
              case (images ? images.length > 0 && images![0].secure_url : false):
                  return <Images images={images!} removeImage={this.removeImage} />;
              case (avatar ? avatar.length > 0: false):
                  return <Avatar avatar={avatar!} removeImage={this.removeImage}/>
              default:
                  return <ImageButtons onChange={this.onChange} isMultiFile={false} />
          }
      };

      const currentBio = () => {
          if (this.state.aboutMe && this.state.aboutMe.length > 0){
              return (
                  <div className="row mt-3">
                      <div className="col-lg-12 pt-3 border-bottom border-top" >
                          <label htmlFor='input-about-me' className="font-weight-bold">
                              Current Bio
                          </label>
                          <pre>{ this.state.aboutMe }</pre>
                      </div>
                  </div>)
          } else {
              return
          }
      };

      return (
          <div>
              <div className="row ">
                  {/*<div className='buttons'>*/}
                  <div className="col-lg-3 pt-3">
                      {avatarLoader()}
                  </div>
                  <div className="col-lg-9 pt-3">
                      <h5>Upload an image from your computer</h5>
                      <p>JPEG or PNG with a maximum size of 150 KB</p>
                  </div>
              </div>
              <form onSubmit={this.handleUpdateSave}>
                  <div className="row">
                      <div className="col-lg-6 pt-3">
                          <label htmlFor='input-username' className="font-weight-bold">
                              User name
                          </label>
                          <input id="input-username" className="rounded form-control" type="text" ref={this.userName} required={true} placeholder="User name" defaultValue={this.state.userName}/>
                      </div>
                      <div className="col-lg-6 pt-3">
                          <label htmlFor='input-email' className="font-weight-bold">
                              E-mail
                          </label>
                          <input id="input-email" className="rounded form-control" type="text" ref={this.contactEmail} required={true} placeholder="Email" defaultValue={this.state.email}/>
                      </div>
                  </div>
                  <div className="row">
                      <div className="col-lg-6 pt-3">
                          <label htmlFor='input-name' className="font-weight-bold">
                              First name
                          </label>
                          <input id="input-name" className="rounded form-control" type="text" ref={this.firstName} required={true} placeholder="First name" defaultValue={this.state.firstName}/>
                      </div>
                      <div className="col-lg-6 pt-3">
                          <label htmlFor='input-surname' className="font-weight-bold">
                              Last name
                          </label>
                          <input id="input-surname" className="rounded form-control" type="text" ref={this.lastName} required={true} placeholder="Last name" defaultValue={this.state.lastName}/>
                      </div>
                  </div>
                  <div className="row">
                      <div className="col-lg-6 pt-3">
                          <label htmlFor='input-password' className="font-weight-bold">
                              New password
                          </label>
                          <input id="input-password" className="rounded form-control" type="password" ref={this.password} required={false} placeholder="*******" />
                      </div>
                      <div className="col-lg-6 pt-3">
                          <label htmlFor='input-confirm' className="font-weight-bold">
                              Repeat new password
                          </label>
                          <input id="input-confirm" className="rounded form-control" type="password" ref={this.confirm} required={false} placeholder="*******"/>
                      </div>
                  </div>
                  { currentBio() }
                  <div className="row">
                      <div className="col-lg-12 pt-3">
                          <label htmlFor='input-about-me' className="font-weight-bold">
                              Bio update
                          </label>
                          <textarea id="input-about-me" className="rounded form-control"  rows={8} cols={80}
                                    ref={this.aboutMe} required={false} placeholder="Tell us a bit about yourself..."
                          />
                      </div>
                  </div>
                  <div className="row my-3 text-center">
                      <div className="col">
                          <input type="submit" className="btn btn-success px-5" value="Save!"/>
                      </div>
                  </div>
              </form>
          </div>

      )
  }
};