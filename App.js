import { StatusBar } from 'expo-status-bar'
import * as Permissions from 'expo-permissions'
import React,{useState,useEffect, useRef} from 'react'
import { StyleSheet, Button, Text, View, ImageBackground, Image, Dimensions, TouchableOpacity, ActivityIndicator, Switch, ToastAndroid, Animated} from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
const window = Dimensions.get('window')
const screen = Dimensions.get('screen')

export default function App() {
  let appData = require('./app.json') 
  const dimensionImage = size =>{
  if(size < 0)
    return 0
  else if(size > 5000)
    return 5000
  else return size
  }
  
  const [isWindow,setIsWindow] = useState(false)
  const [dimension,setDimension] = useState({window, screen})
  const resolution = r =>{
    if(r == 'width'){
     return dimensionImage(parseInt(isWindow ? dimension.screen.width : dimension.window.width))   
    }
    else if(r == 'height'){
      return dimensionImage(parseInt(isWindow ? dimension.screen.height : dimension.window.height))   
    }
  }

  const onChangeDimensionsOption = ({window, screen})=>{
    setDimension({window, screen})
  }


  useEffect(() => { 
    Dimensions.addEventListener('change',onChangeDimensionsOption)
    return () =>{
      Dimensions.removeEventListener('change',onChangeDimensionsOption)
    }
  })

  useEffect(()=>{getImage()},[])
  
  const [image,setImage] = useState()
  const [isLoading,setIsLoading] = useState(false)

  async function getImage() {
    setIsLoading(false)
    await fetch(`https://picsum.photos/${resolution('width')}/${resolution('height')}`)
      .then(res=>{
	setImage(res.url)
	setIsLoading(true)
      }).catch((err)=>alert(err))
  }

  const Loading = ()=>{
  return(
    <>
    <Text style={styles.text}>Loading</Text>
    <ActivityIndicator size='large' color='white' />
    </>
  )
  }

  const fadeAnim = useRef(new Animated.Value(0)).current 

  const fadeIn= ()=>{
    Animated.timing(fadeAnim,{
      toValue:1,
      duration: 500,
      useNativeDriver:true
    }).start(({finished})=>{
      if(finished)
	Animated.timing(fadeAnim,{
	  toValue:0,
	  delay:700,
	  duration:500,
	  useNativeDriver:true}).start()
    })
  } 

   const saveImage = async (err = null) => {
    let cameraPermissions = await Permissions.getAsync(Permissions.CAMERA_ROLL)
    if(cameraPermissions.status !== 'granted'){
      cameraPermissions = await Permissions.askAsync(Permissions.CAMERA_ROLL) 
    }
    if(cameraPermissions.status === 'granted'){
      let filePath = `${FileSystem.documentDirectory}image.jpg`
      setIsLoading(false)
      FileSystem.downloadAsync(image,filePath)
      .then(({uri}) => {
	setIsLoading(true)
	MediaLibrary.saveToLibraryAsync(uri)
	alert('saved to photos')
      }).catch(error => {console.log('saveImage error:',err !== null ? err+' and '+error : error)})
    }else { 
      alert('Requires cameral roll permissions')
    }
  }
  
  const download = () =>{
      setIsLoading(false)
      fetch(image).then( res =>{
	return res.blob()
      }).then( blob => {
	  setIsLoading(true)
	  if(window.navigator && window.navigator.msSaveOrOpenBlob)
	  window.navigator.msSaveOrOpenBlob(blob,image)
	  else{
	  let a = document.createElement('a')
	  a.href = URL.createObjectURL(blob)
	  a.download = `${appData.expo.name}__${image}.jpg`
	  a.click();
	  }
      }).catch(error => saveImage(error))
        }


  const Content = ()=>{
  return(<>
      <Switch onValueChange={()=>{
	setIsWindow(!isWindow) 
	onChangeDimensionsOption(dimension)
	fadeIn()
      }} 
	value={isWindow} trackColor='#ccc' thumbColor={isWindow? 'white' : '#ccc'}/>
      <Text style={styles.text}>{`${resolution('width')}x${resolution('height')}`}</Text>
      <Button  onPress={()=>getImage()} title='go to next image' color='#1a1a237e' touchSoundDisable={false}/> 
      <TouchableOpacity onPress={() => download()} >
      <Text style={[styles.text,{fontSize:20}]}>{'download'}</Text>
      </TouchableOpacity> 
    </>)
  }
    const Splash = ()=>{
    return(
      <>
      <Image style={{width:60,height:60, margin:20}} source={require('./assets/favicon.png')}/>
      <ActivityIndicator size='large' color='black' />
      <Text style={{marginTop:10}}>opening {appData.expo.name} {appData.expo.version}</Text>
      </>
    )
    }
    
    const MainScreen = ()=>{
    return(
      <>
      <ImageBackground resizeMode='cover' blurRadius={0} style={[{width:resolution('width'),height:resolution('height')},styles.image]} source={{uri:image}}>
      {isLoading ? <Content/>  : <Loading/>}
      </ImageBackground>
      </>
    )
  }

  return (
    <View style={styles.container}>
    {image != null ? <MainScreen/> : <Splash/> }
      <StatusBar style="dark"  />
    <Animated.Text style={{position:'absolute',top:'90%',opacity:fadeAnim}}>
    <Text style={[styles.text,{fontSize:14}]}>{isWindow ? 'screen resolution' : 'window resolution'}</Text>
    </Animated.Text> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image:{
    justifyContent: 'center',
    alignItems: 'center',
  },
  text:{ 
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
    textShadowColor: 'black',
    textShadowRadius:6,
  }
});
