const http=require('http')

let url="http://ww.baidu.com"

http.get(url,(res)=>{
    res.on('data',(chunk)=>{
        console.log('数据传输')
        console.log(chunk.toString('utf-8'))
    })
    res.on('end',()=>{
        console.log('数据传输完毕')
    })
}).on('error',(err)=>{
    console.log('请求错误')
})