'use strict';

(function (
            Grammar,
            Keyword,
            Prio,
            Regex,
            Sequence,
            THIS
        ) {
    var k_born = Keyword('born');
    var k_died = Keyword('died');
    var r_year = Regex('(?:[12]{1}[0-9]{3})');
    var s_born_year = Sequence(k_born, r_year);
    var s_died_year = Sequence(k_died, r_year);
    var START = Prio(
        r_year,
        k_born,
        k_died,
        s_born_year,
        s_died_year,
        Sequence('(', THIS, ')'),
        Sequence(THIS, Keyword('or'), THIS),
        Sequence(THIS, Keyword('and'), THIS)
    );
    window.Grammar = Grammar(START);
})(
    window.jsleri.Grammar,
    window.jsleri.Keyword,
    window.jsleri.Prio,
    window.jsleri.Regex,
    window.jsleri.Sequence,
    window.jsleri.THIS,
);
