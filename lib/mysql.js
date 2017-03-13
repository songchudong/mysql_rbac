// 引入mysql数据库模块
var mysql = require('mysql');

var logic = require('./logic');
// 引入异步库
var Q = require('q');


// 数据库封装
module.exports = function(config, rabc) {
    var _this = this;
    _this.poolConn = mysql.createPool(config);

    _this.query = function(sql, param) {
        var deferred = Q.defer();
        param = param || [];
        _this.poolConn.getConnection(function(err, conn) {
            if (err) {
                deferred.reject({
                    errCode: error.sqlState,
                    errMag: error.code
                });
            } else {

                conn.query(sql, param, function(error, results, fields) {
                    if (error) {
                        deferred.reject({
                            errCode: error.sqlState,
                            errMag: error.code
                        });
                    } else {
                        deferred.resolve({
                            error: error,
                            results: results,
                            fields: fields
                        });
                    }

                });
                //释放连接                
                conn.release();
            }

        });
        return deferred.promise;
    };


    // 查询用户对应的角色id
    _this.queryuser = function(id) {
        var deferred = Q.defer();
        _this.query('select ' + rabc.userTrole + ' from ' + rabc.user + ' where id = ' + id).then(function(data) {

            deferred.resolve(data.results);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    // 查询用户对应的角色id
    _this.queryrole = function(idarr) {
        var idparam = [];
        for (var i = 0; i < idarr.length; i++) {
            idparam.push(idarr[i][rabc.userTrole]);
        }
        // 去重
        idparam = logic.unique(idparam.join(',').split(',')).join(',');
        var deferred = Q.defer();
        _this.query('select ' + rabc.roleTnode + ' from ' + rabc.role + ' where id in (' + idparam + ')').then(function(data) {
            deferred.resolve(data.results);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    // 查询角色对应的权限路由
    _this.querynode = function(idarr) {
        var idparam = [];
        for (var i = 0; i < idarr.length; i++) {
            idparam.push(idarr[i][rabc.roleTnode]);
        }
        // 去重
        idparam = logic.unique(idparam.join(',').split(',')).join(',');
        var deferred = Q.defer();
        _this.query('select ' + rabc.nodeTroute + ' from ' + rabc.node + ' where id in (' + idparam + ')').then(function(data) {
            deferred.resolve(data.results);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    // 导出权限路由
    _this.onlyRoot = function(userid) {
        var deferred = Q.defer();
        _this.queryuser(userid)
            .then(_this.queryrole)
            .then(_this.querynode)
            .then(function(data) {
                var idparam = [];
                for (var i = 0; i < data.length; i++) {
                    idparam.push(data[i][rabc.nodeTroute]);
                }
                // 去重
                idparam = logic.unique(idparam.join(',').split(','));
                deferred.resolve(idparam);
            }, function(error) {
                deferred.reject(error);
            });
        return deferred.promise;
    }

    return {
        onlyRoot: _this.onlyRoot
    }
}