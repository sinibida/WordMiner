import axios from "axios";

const dictHttp = axios.create({
  baseURL: 'https://api.dictionaryapi.dev/api/v2/'
})

export {
  dictHttp
}