public class BadClass
{
    public void Foo()
    {
        try { Worker.Join(1000); } catch { }
        catch (Exception e) { Log(e); }
        finally { Cleanup(); }
    }
}
