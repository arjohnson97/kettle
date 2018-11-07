import React, { PureComponent } from 'react'
import * as firebase from 'firebase'

import {
  Input, Button, Form, Icon, Menu, Dropdown
} from 'antd'

import CreateKettleModal from './components/CreateKettleModal'
import ImageDropper from './components/ImageDropper'

const Search = Input.Search
const FormItem = Form.Item

// Initialize Firebase
const config = {
  apiKey: 'AIzaSyD71FqS5lCiGdJuE8UrfS4Ic_TgHsgikV4',
  authDomain: 'kettle-84ea2.firebaseapp.com',
  databaseURL: 'https://kettle-84ea2.firebaseio.com',
  projectId: 'kettle-84ea2',
  storageBucket: 'kettle-84ea2.appspot.com',
  messagingSenderId: '850017678808'
}
firebase.initializeApp(config)

const storage = firebase.storage()
const database = firebase.database()
const storageRef = storage.ref()
const kettlesRef = storageRef.child('kettles/')

export default class Kettle extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      value: '',
      currentKettle: '',
      contentText: '',
      showModal: false,
      searchedKettle: '',
      error: false,
      allKettles: [],
      images: [],
      imageUrls: []
    }

    this.handleChange = this.handleChange.bind(this)
    this.updateKettle = this.updateKettle.bind(this)
    this.hideModal = this.hideModal.bind(this)
    this.updateContent = this.updateContent.bind(this)
    this.onKeyPress = this.onKeyPress.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
    // this.getImages = this.getImages.bind(this)
  }

  componentDidMount () {
    if (window.location.pathname.length > 1) {
      const kettle = window.location.pathname.slice(1)
      this.getKettle(kettle)
    }
    this.getAllKettles()
  }

  showModal () {
    this.setState({ showModal: true })
  }

  hideModal () {
    this.setState({ showModal: false })
  }

  handleChange (event) {
    this.setState({ searchedKettle: event.target.value })
  }

  onKeyPress (event) {
    if (event.which === 13) {
      event.preventDefault()
      this.getKettle(this.state.searchedKettle)
    }
  }

  getAllKettles () {
    const checkRef = database.ref('kettles')
    checkRef.on('value', (snapshot) => {
      this.setState({ allKettles: Object.keys(snapshot.val() || []) })
    })
  }

  deleteImage (index) {
    console.log(this.state.images)
    const ref = storageRef.child(`kettles/${this.state.currentKettle}/${this.state.images[index].name}`)
    ref.delete().then(() => {
      console.log('deleted')
      this.getKettle()
    })
  }

  getKettle (kettle) {
    const ref = firebase
      .database()
      .ref(`kettles/${kettle}/`) // this.state.kettleTitle = kettleId;

    const checkRef = database.ref('kettles/') // Checks if the searched Kettle exists
    checkRef.once('value', (snapshot) => {
      if (!snapshot.hasChild(kettle)) {
        this.setState({ currentKettle: '', error: true })
      } else {
        ref.once('value', (snapshot) => {
          this.setState({ currentKettle: kettle,
            contentText: snapshot.val().content || '',
            images: snapshot.val().images ? Object.values(snapshot.val().images) : [],
            error: false })

          const images = snapshot.val().images

          if (images) {
            Object.values(images).map(image => {
              const ref = storageRef.child(`kettles/${kettle}/${image.name}`)
              ref.getDownloadURL().then(url => {
                this.setState({ imageUrls: this.state.imageUrls.concat(url) })
              })
            })
          } else {}
        })
      }
    })
  }

  updateContent (e) {
    database.ref(`kettles/${this.state.currentKettle}/`).set({
      content: e.target.value
    })
    const contentRef = firebase
      .database()
      .ref(`kettles/${this.state.currentKettle}/content`) // this.state.kettleTitle = kettleId;

    const checkRef = database.ref('kettles/') // Checks if the searched Kettle exists
    checkRef.on('value', (snapshot) => {
      contentRef.on('value', (snapshot) => {
        this.setState({ contentText: snapshot.val() })
      })
    })
  }

  updateKettle (newKettleName) {
    this.getKettle(newKettleName)
    this.setState({ currentKettle: newKettleName, showModal: false })
  }

  handleUpload (files) {
    files.map((file, index) => {
      const ref = kettlesRef.child(`${this.state.currentKettle}/${file.name}`)
      let blob = new Blob([file], {type: file.type})

      ref.put(blob).then(snapshot => {
        const name = file.name.replace(/\./g, '')
        database.ref(`kettles/${this.state.currentKettle}/images/${name}`).set({
          name: file.name
        })
        console.log(`Uploaded ${index + 1}/${files.length}`)
        this.getKettle(this.state.currentKettle)
      })
    })
  }

  render () {
    const menu = (
      <Menu>
        {this.state.allKettles.map(kettle => {
          return (
            <Menu.Item onClick={() => this.getKettle(kettle)} key={kettle}>{kettle}</Menu.Item>
          )
        })}
      </Menu>
    )

    const images = (
      <div>
        {this.state.imageUrls.map((url, index) => {
          if (!url) {
            return null
          }
          return <img key={url} src={url} height="auto" width="200" onClick={() => this.deleteImage(index)} />
        })}
      </div>
    )

    return (
      <div style={{padding: '0px 20px', userSelect: 'none'}}>
        <div style={{ textAlign: 'center', fontSize: '24px', marginTop: '20px' }}>
          <Icon type="coffee" /> kettle | <small>{this.state.currentKettle}</small>
        </div>
        <Button
          style={{
            margin: '20px auto',
            display: 'flex',
            border: 'none'
          }}
          className="add-button"
          onClick={() => this.showModal()}
        >
          <Icon type="plus-circle" className="create-icon" />
        </Button>
        <form
          onKeyPress={this.onKeyPress}
          style={{ maxWidth: '900px', margin: '0px auto' }}
        >
          <Dropdown overlay={menu} trigger={['click']}>
            <div style={{width: '100%', margin: '10px 0', textAlign: 'center'}}>Kettles <Icon type="down" /></div>
          </Dropdown>
          <FormItem>
            <Search
              type="text"
              placeholder="Search for Kettle..."
              size="large"
              enterButton
              onSearch={() => this.getKettle(this.state.searchedKettle)}
              onChange={this.handleChange}
              style={{borderRadius: '20px !important'}}
              autoFocus
              className="searchBar"
            />
          </FormItem>
          {this.state.error && <span style={{color: 'red'}}>Kettle does not exist.</span>}
          <FormItem>
            <Input.TextArea
              value={this.state.contentText}
              onChange={e => this.updateContent(e)}
            />
          </FormItem>

        </form>
        <ImageDropper handleUpload={this.handleUpload} />

        <div />
        { this.state.imageUrls.length > 0 && images }
        <CreateKettleModal visible={this.state.showModal} cancel={this.hideModal} updateKettle={this.updateKettle} />
      </div>
    )
  }
}
