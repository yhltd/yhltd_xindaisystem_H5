let carouselInterval = null; // 全局轮播定时器

// function fetchPushNews() {
// //     var xhr = new XMLHttpRequest();
// //     xhr.open('GET', '/pushnews/getnews', true);
// //     xhr.setRequestHeader('Content-Type', 'application/json');
// //     xhr.withCredentials = true;
// //
// //     xhr.onreadystatechange = function() {
// //         if (xhr.readyState === 4) {
// //             if (xhr.status >= 200 && xhr.status < 300) {
// //                 try {
// //                     var data = JSON.parse(xhr.responseText);
function fetchPushNews() {
    var xhr = new XMLHttpRequest();

    // 从本地存储获取公司名称
    var companyName = localStorage.getItem('savedCompany') || '默认公司名称';
    console.log('获取到的公司名称:', companyName);

    // 将公司名称作为参数传递
    xhr.open('GET', '/pushnews/getnews?company=' + encodeURIComponent(companyName), true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.withCredentials = true;

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var data = JSON.parse(xhr.responseText);

                    if (data.success) {
                        const newsData = data.data.recordset || data.data.recordsets[0] || [];

                        if (newsData && newsData.length > 0) {
                            const firstNews = newsData[0];

                            // if (firstNews.beizhu2 && firstNews.beizhu2.trim() !== "") {
                            //     var logoImage = "data:image/jpg;base64," + firstNews.beizhu2;
                            //     var logoImg = document.querySelector('a[href="http://www.yhocn.cn"] img');
                            //
                            //     if (logoImg) {
                            //         logoImg.src = logoImage;
                            //         console.log("网站Logo已更新");
                            //     }
                            // }
                            if (firstNews.beizhu2 && firstNews.beizhu2.trim() !== "") {
                                // 简化的base64检查
                                if (isLikelyBase64(firstNews.beizhu2)) {
                                    var logoImage = "data:image/jpg;base64," + firstNews.beizhu2;
                                    var logoImg = document.querySelector('a[href="http://www.yhocn.cn"] img');

                                    if (logoImg) {
                                        logoImg.src = logoImage;
                                        console.log("网站Logo已更新");
                                    }
                                } else {
                                    console.log("beizhu2内容不是base64格式，跳过Logo更新");
                                }
                            }

                            if (firstNews.beizhu3) {
                                if (firstNews.beizhu3.trim() !== "") {
                                    // 替换logo文字
                                    var logoTextElement = document.querySelector('div.logo');
                                    if (logoTextElement) {
                                        // 方法1：使用文本节点替换（推荐，不会破坏HTML结构）
                                        var textNodes = [];
                                        for (var i = 0; i < logoTextElement.childNodes.length; i++) {
                                            if (logoTextElement.childNodes[i].nodeType === 3) { // 文本节点
                                                textNodes.push(logoTextElement.childNodes[i]);
                                            }
                                        }

                                        if (textNodes.length > 0) {
                                            // 替换第一个文本节点的内容
                                            textNodes[0].textContent = firstNews.beizhu3;
                                            console.log("Logo文字已替换为:", firstNews.beizhu3);
                                        } else {
                                            // 方法2：如果没有文本节点，在img标签前插入文字
                                            var imgElement = logoTextElement.querySelector('img#daohang');
                                            if (imgElement) {
                                                var textNode = document.createTextNode(firstNews.beizhu3);
                                                logoTextElement.insertBefore(textNode, imgElement);
                                                console.log("Logo文字已插入为:", firstNews.beizhu3);
                                            }
                                        }
                                    } else {
                                        console.log("未找到div.logo元素");
                                    }
                                }
                            }

                            if(firstNews.beizhu1 == "隐藏广告"){
                                // 添加隐藏类
                                var carouselIndex1 = document.querySelector('.carousel-index');
                                var carouselContainer1 = document.querySelector('.carousel-container');

                                if (carouselIndex1) {
                                    carouselIndex1.classList.add('hidden-ad');
                                }
                                if (carouselContainer1) {
                                    carouselContainer1.classList.add('hidden-ad');
                                }

                                return;
                            }


                            // 清除之前的定时器
                            if (carouselInterval) {
                                clearInterval(carouselInterval);
                                carouselInterval = null;
                            }

                            // 设置主图片（悬浮图）
                            const xuantu = firstNews.tptop1 ? "data:image/jpg;base64," + firstNews.tptop1 : "";

                            // 设置悬浮图
                            const targetImg = document.querySelector('.index-images img');
                            if (targetImg && xuantu) {
                                targetImg.src = xuantu;
                                targetImg.alt = "悬浮主图";
                            }

                            // 设置轮播图片
                            const carouselImages = [];

                            // 添加轮播图片（只添加有数据的图片）
                            if (firstNews.tptop2 && firstNews.tptop2.trim() !== "") {
                                carouselImages.push({
                                    url: "data:image/jpg;base64," + firstNews.tptop2,
                                    alt: "轮播图1"
                                });
                            }
                            if (firstNews.tptop3 && firstNews.tptop3.trim() !== "") {
                                carouselImages.push({
                                    url: "data:image/jpg;base64," + firstNews.tptop3,
                                    alt: "轮播图2"
                                });
                            }
                            if (firstNews.tptop4 && firstNews.tptop4.trim() !== "") {
                                carouselImages.push({
                                    url: "data:image/jpg;base64," + firstNews.tptop4,
                                    alt: "轮播图3"
                                });
                            }
                            if (firstNews.tptop5 && firstNews.tptop5.trim() !== "") {
                                carouselImages.push({
                                    url: "data:image/jpg;base64," + firstNews.tptop5,
                                    alt: "轮播图4"
                                });
                            }
                            if (firstNews.tptop6 && firstNews.tptop6.trim() !== "") {
                                carouselImages.push({
                                    url: "data:image/jpg;base64," + firstNews.tptop6,
                                    alt: "轮播图5"
                                });
                            }

                            const tankuan = firstNews.xuankuan || 100;
                            const dinggao = firstNews.topgao || 300;
                            const textboxValue = firstNews.textbox || "";

                            // 存储到localStorage
                            localStorage.setItem('marqueeTextValue', textboxValue);


                            // 设置容器样式
                            const carouselContainer = document.querySelector('.carousel-container');
                            if (carouselContainer) {
                                carouselContainer.style.width = '100%';
                                carouselContainer.style.height = dinggao + 'px';
                            }

                            // 初始化轮播图（只有在有轮播图片的情况下）
                            if (carouselImages.length > 0) {
                                initCarousel(carouselImages, dinggao);
                            }

                            // 设置CSS变量
                            document.documentElement.style.setProperty('--tankuan', tankuan + "px");
                            document.documentElement.style.setProperty('--dinggao', dinggao + "px");

                            // 更新跑马灯文本
                            updateMarqueeText(textboxValue);

                        } else {
                            console.warn(' 没有找到新闻数据');
                        }
                    } else {
                        console.warn('请求返回失败:', data.message);
                    }
                } catch (e) {
                    console.error('JSON解析错误:', e);
                }
            } else {
                console.error('HTTP错误! 状态码:', xhr.status);
            }
        }
    };

    xhr.onerror = function() {
        console.error('网络请求失败');
    };

    xhr.timeout = 10000;
    xhr.ontimeout = function() {
        console.error('请求超时');
    };

    xhr.send();
}

// 初始化轮播图
function initCarousel(carouselImages, dinggao) {
    let currentIndex = 0;
    const totalItems = carouselImages.length;

    // 获取轮播图容器
    const carouselImagesContainer = document.getElementById('carouselImages');

    // 检查容器是否存在
    if (!carouselImagesContainer) {
        console.error('轮播图容器不存在');
        return;
    }

    // 清空现有的轮播内容
    carouselImagesContainer.innerHTML = '';

    // 动态生成轮播项
    carouselImages.forEach((image, index) => {
        // 创建轮播项
        const item = document.createElement('div');
        item.className = 'carousel-item';
        item.id = `carouselImg${index + 1}`;

        if (index === 0) {
            item.classList.add('active');
        }

        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.alt;
        img.style.width = '100%';
        img.style.height = dinggao + 'px';
        img.style.objectFit = 'cover';

        item.appendChild(img);
        carouselImagesContainer.appendChild(item);
    });

    // 切换到指定幻灯片
    function goToSlide(index) {
        // 隐藏所有图片
        document.querySelectorAll('.carousel-item').forEach(item => {
            item.classList.remove('active');
        });

        // 显示指定图片
        const nextItem = document.getElementById(`carouselImg${index + 1}`);
        if (nextItem) {
            nextItem.classList.add('active');
        }

        currentIndex = index;
    }

    // 切换图片函数
    function switchImage() {
        goToSlide((currentIndex + 1) % totalItems);
    }

    // 设置自动切换（只有在多张图片的情况下）
    if (totalItems > 1) {
        carouselInterval = setInterval(switchImage, 5000);
    }

    // 鼠标悬停时暂停轮播
    const container = document.querySelector('.carousel-container');
    if (container && totalItems > 1) {
        container.addEventListener('mouseenter', () => {
            if (carouselInterval) {
                clearInterval(carouselInterval);
                carouselInterval = null;
            }
        });

        container.addEventListener('mouseleave', () => {
            if (!carouselInterval) {
                carouselInterval = setInterval(switchImage, 5000);
            }
        });
    }
}

// 更新跑马灯文本
function updateMarqueeText(textboxValue) {
    const marqueeText = document.getElementById('marqueeText');
    if (marqueeText && textboxValue) {
        marqueeText.textContent = textboxValue;
    }
}

// 隐藏轮播图
function yinClick() {
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.style.display = 'none';
    }
}

// 隐藏悬浮图
function tanClick() {
    const carouselIndex = document.querySelector('.carousel-index');
    if (carouselIndex) {
        carouselIndex.style.display = 'none';
    }
}

// 显示轮播图（如果需要的话）
function showCarousel() {
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.style.display = 'block';
    }
}

function isLikelyBase64(str) {
    // 基础检查
    if (!str || str.trim() === "") return false;

    // 检查长度（base64长度通常是4的倍数）
    if (str.length % 4 !== 0) return false;

    // 检查字符集（base64只包含特定字符）
    var base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    return base64Regex.test(str);
}

// 显示悬浮图（如果需要的话）
function showPopupImage() {
    const carouselIndex = document.querySelector('.carousel-index');
    if (carouselIndex) {
        carouselIndex.style.display = 'block';
    }
}

// 页面卸载时清理定时器
window.addEventListener('beforeunload', function() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
});

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 从localStorage获取跑马灯文本
    const textboxValue = localStorage.getItem('marqueeTextValue');
    updateMarqueeText(textboxValue);

    // 开始获取新闻数据
    fetchPushNews();
});

// 添加到全局作用域
window.testPushNews = function() {
    fetchPushNews();
};

window.fetchPushNews = fetchPushNews;
window.yinClick = yinClick;
window.tanClick = tanClick;
window.showCarousel = showCarousel;
window.showPopupImage = showPopupImage;