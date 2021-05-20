
//Mobile Menu
$('.nav-menu').click(function(){
    $('.nav-menu').toggleClass('active')
    $('.menu-toggle').removeClass('active')
});

$('.menu-toggle').click(function(){
    $('.nav-menu').toggleClass('active')
    $('.menu-toggle').toggleClass('active')
});

window.addEventListener('scroll', function(){
    $('header').toggleClass('stick', window.scrollY > 0)
});

// Modal Menu
/*$('.new-post').click(function(e){
    e.preventDefault()

    $('.add-post-container').css('display', 'block')

})*/


$('.profile').click(function(e){
    e.preventDefault()
    $('.user-profile').toggleClass('active')
})
