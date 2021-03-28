module.exports = { 
    isset : (value) => {
        let flag = true;
        if(typeof value == 'undefined' || value == null || value == ''){
            flag = false;
        }
        return flag;
    },

    isAuth : (req,res,next) => {

        if(req.session.isAuth){
            next();
        } else {
            res.redirect('/user/login');
        }
        
    }

}
    